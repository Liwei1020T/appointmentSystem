-- ============================================================================
-- Migration 007: Admin User Management Enhancement
-- ============================================================================
-- Purpose: Add admin-specific columns and features to users system
-- Date: 2025-12-11
-- Phase: 3.6 - Admin User Management
-- ============================================================================

-- ============================================================================
-- 1. ALTER USERS TABLE
-- ============================================================================

-- Add admin management columns if they don't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN users.is_blocked IS 'Whether the user is blocked by admin';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Users table indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_role 
  ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_is_blocked 
  ON users(is_blocked);

CREATE INDEX IF NOT EXISTS idx_users_created_at 
  ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_points 
  ON users(points DESC);

CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_phone 
  ON users(phone) 
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_referral_code 
  ON users(referral_code) 
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_referred_by 
  ON users(referred_by) 
  WHERE referred_by IS NOT NULL;

-- Points log indexes
CREATE INDEX IF NOT EXISTS idx_points_log_user_id 
  ON points_log(user_id);

CREATE INDEX IF NOT EXISTS idx_points_log_created_at 
  ON points_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_points_log_type 
  ON points_log(type);

-- Orders indexes for user queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON users;

CREATE TRIGGER trigger_update_user_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- ============================================================================
-- 4. UPDATE RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_all_for_admins ON users;

-- Users can view their own data
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own non-sensitive data
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Users cannot change their own role or blocked status
    role = OLD.role AND
    is_blocked = OLD.is_blocked
  );

-- Admins can view and manage all users
CREATE POLICY users_all_for_admins
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user statistics summary
CREATE OR REPLACE FUNCTION get_user_summary(user_uuid UUID)
RETURNS TABLE (
  total_orders BIGINT,
  completed_orders BIGINT,
  total_spent NUMERIC,
  total_points_earned INTEGER,
  active_packages INTEGER,
  available_vouchers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total orders
    (SELECT COUNT(*) FROM orders WHERE user_id = user_uuid),
    -- Completed orders
    (SELECT COUNT(*) FROM orders WHERE user_id = user_uuid AND status = 'completed'),
    -- Total spent
    COALESCE((SELECT SUM(price) FROM orders WHERE user_id = user_uuid AND status = 'completed'), 0),
    -- Total points earned (sum of positive points)
    COALESCE((SELECT SUM(amount) FROM points_log WHERE user_id = user_uuid AND amount > 0), 0),
    -- Active packages
    (SELECT COUNT(*) FROM user_packages 
     WHERE user_id = user_uuid AND remaining > 0 AND expiry > NOW())::INTEGER,
    -- Available vouchers
    (SELECT COUNT(*) FROM user_vouchers 
     WHERE user_id = user_uuid AND status = 'available')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top users by spending
CREATE OR REPLACE FUNCTION get_top_users_by_spending(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  total_spent NUMERIC,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    COALESCE(SUM(o.price), 0) as total_spent,
    COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
  GROUP BY u.id, u.full_name, u.email
  ORDER BY total_spent DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user growth statistics
CREATE OR REPLACE FUNCTION get_user_growth_stats(days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  new_users INTEGER,
  cumulative_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT 
      CURRENT_DATE - generate_series(days - 1, 0, -1) as date
  ),
  daily_new_users AS (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM users
    WHERE created_at >= CURRENT_DATE - days
    GROUP BY DATE(created_at)
  )
  SELECT 
    ds.date,
    COALESCE(dnu.new_users, 0)::INTEGER as new_users,
    (SELECT COUNT(*)::INTEGER FROM users WHERE DATE(created_at) <= ds.date) as cumulative_users
  FROM date_series ds
  LEFT JOIN daily_new_users dnu ON ds.date = dnu.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block/unblock user and log the action
CREATE OR REPLACE FUNCTION admin_block_user(
  target_user_id UUID,
  admin_user_id UUID,
  should_block BOOLEAN,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the acting user is an admin
  SELECT role IN ('admin', 'super_admin') INTO is_admin
  FROM users
  WHERE id = admin_user_id;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can block/unblock users';
  END IF;

  -- Update user blocked status
  UPDATE users
  SET is_blocked = should_block,
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Log the action (optional: create an admin_actions table)
  -- INSERT INTO admin_actions (admin_id, action, target_user_id, reason)
  -- VALUES (admin_user_id, CASE WHEN should_block THEN 'block' ELSE 'unblock' END, target_user_id, reason);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to adjust user points with logging
CREATE OR REPLACE FUNCTION admin_adjust_user_points(
  target_user_id UUID,
  points_amount INTEGER,
  adjustment_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  new_points INTEGER,
  message TEXT
) AS $$
DECLARE
  current_points INTEGER;
  calculated_new_points INTEGER;
BEGIN
  -- Get current points
  SELECT points INTO current_points
  FROM users
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'User not found';
    RETURN;
  END IF;

  -- Calculate new points (cannot go below 0)
  calculated_new_points := GREATEST(0, current_points + points_amount);

  -- Update user points
  UPDATE users
  SET points = calculated_new_points,
      updated_at = NOW()
  WHERE id = target_user_id;

  -- Log the adjustment
  INSERT INTO points_log (user_id, amount, type, source)
  VALUES (target_user_id, points_amount, 'adjusted', 'Admin adjustment: ' || adjustment_reason);

  RETURN QUERY SELECT true, calculated_new_points, 'Points adjusted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE ADMIN DASHBOARD VIEW
-- ============================================================================

-- View for quick admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE is_blocked = false) as active_users,
  (SELECT COUNT(*) FROM users WHERE is_blocked = true) as blocked_users,
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
  (SELECT COALESCE(SUM(price), 0) FROM orders WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(SUM(profit), 0) FROM orders WHERE status = 'completed') as total_profit,
  (SELECT COALESCE(SUM(points), 0) FROM users) as total_points_distributed;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Verify columns added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_blocked', 'updated_at');

-- Verify indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'orders', 'points_log')
  AND indexname LIKE 'idx_%';

-- Verify policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';

-- Verify functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_user_updated_at',
    'get_user_summary',
    'get_top_users_by_spending',
    'get_user_growth_stats',
    'admin_block_user',
    'admin_adjust_user_points'
  );

-- Verify view created
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name = 'admin_dashboard_stats';

-- ============================================================================
-- 8. SAMPLE TEST QUERIES
-- ============================================================================

-- Test user summary function
-- SELECT * FROM get_user_summary('user-uuid-here');

-- Test top users by spending
-- SELECT * FROM get_top_users_by_spending(10);

-- Test user growth stats (last 7 days)
-- SELECT * FROM get_user_growth_stats(7);

-- Test admin dashboard stats view
-- SELECT * FROM admin_dashboard_stats;

-- Test blocking a user
-- SELECT admin_block_user('user-uuid', 'admin-uuid', true, 'Violation of terms');

-- Test adjusting points
-- SELECT * FROM admin_adjust_user_points('user-uuid', 100, 'Compensation for issue');

-- ============================================================================
-- 9. ROLLBACK SCRIPT (For reference - DO NOT RUN unless needed)
-- ============================================================================

/*
-- Drop view
DROP VIEW IF EXISTS admin_dashboard_stats;

-- Drop functions
DROP FUNCTION IF EXISTS admin_adjust_user_points(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS admin_block_user(UUID, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS get_user_growth_stats(INTEGER);
DROP FUNCTION IF EXISTS get_top_users_by_spending(INTEGER);
DROP FUNCTION IF EXISTS get_user_summary(UUID);
DROP FUNCTION IF EXISTS update_user_updated_at();

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON users;

-- Drop policies
DROP POLICY IF EXISTS users_all_for_admins ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_select_own ON users;

-- Drop indexes
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_points_log_type;
DROP INDEX IF EXISTS idx_points_log_created_at;
DROP INDEX IF EXISTS idx_points_log_user_id;
DROP INDEX IF EXISTS idx_users_referred_by;
DROP INDEX IF EXISTS idx_users_referral_code;
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_points;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_is_blocked;
DROP INDEX IF EXISTS idx_users_role;

-- Remove columns (CAUTION: This will delete data)
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS updated_at,
--   DROP COLUMN IF EXISTS is_blocked;
*/

-- ============================================================================
-- END OF MIGRATION 007
-- ============================================================================
