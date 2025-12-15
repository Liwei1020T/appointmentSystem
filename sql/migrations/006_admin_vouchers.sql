-- ============================================================================
-- Migration 006: Admin Voucher Management Enhancement
-- ============================================================================
-- Purpose: Add admin-specific columns and features to vouchers system
-- Date: 2025-12-11
-- Phase: 3.5 - Admin Voucher Management
-- ============================================================================

-- ============================================================================
-- 1. ALTER VOUCHERS TABLE
-- ============================================================================

-- Add admin management columns
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN vouchers.description IS 'Voucher description for admin reference';
COMMENT ON COLUMN vouchers.usage_limit IS 'Maximum times a user can use this voucher (NULL = unlimited)';
COMMENT ON COLUMN vouchers.valid_from IS 'Start date of voucher validity period';
COMMENT ON COLUMN vouchers.valid_until IS 'End date of voucher validity period';
COMMENT ON COLUMN vouchers.created_by IS 'Admin user who created this voucher';
COMMENT ON COLUMN vouchers.updated_at IS 'Last update timestamp';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Vouchers table indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_active 
  ON vouchers(active);

CREATE INDEX IF NOT EXISTS idx_vouchers_type 
  ON vouchers(type);

CREATE INDEX IF NOT EXISTS idx_vouchers_code 
  ON vouchers(code);

CREATE INDEX IF NOT EXISTS idx_vouchers_validity 
  ON vouchers(valid_from, valid_until) 
  WHERE valid_from IS NOT NULL AND valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vouchers_created_by 
  ON vouchers(created_by);

-- User vouchers table indexes
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user_id 
  ON user_vouchers(user_id);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_voucher_id 
  ON user_vouchers(voucher_id);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_status 
  ON user_vouchers(status);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_created_at 
  ON user_vouchers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_used_at 
  ON user_vouchers(used_at) 
  WHERE used_at IS NOT NULL;

-- ============================================================================
-- 3. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_voucher_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_voucher_timestamp ON vouchers;

CREATE TRIGGER trigger_update_voucher_timestamp
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_voucher_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS vouchers_select_active_for_users ON vouchers;
DROP POLICY IF EXISTS vouchers_all_for_admins ON vouchers;
DROP POLICY IF EXISTS user_vouchers_select_own ON user_vouchers;
DROP POLICY IF EXISTS user_vouchers_all_for_admins ON user_vouchers;

-- VOUCHERS POLICIES

-- Users can view active vouchers
CREATE POLICY vouchers_select_active_for_users
  ON vouchers
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Admins can manage all vouchers
CREATE POLICY vouchers_all_for_admins
  ON vouchers
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

-- USER_VOUCHERS POLICIES

-- Users can view their own vouchers
CREATE POLICY user_vouchers_select_own
  ON user_vouchers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own vouchers (for using them)
CREATE POLICY user_vouchers_update_own
  ON user_vouchers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all user vouchers
CREATE POLICY user_vouchers_all_for_admins
  ON user_vouchers
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

-- Function to get voucher usage statistics
CREATE OR REPLACE FUNCTION get_voucher_usage_stats(voucher_uuid UUID)
RETURNS TABLE (
  total_distributed BIGINT,
  total_used BIGINT,
  total_expired BIGINT,
  total_available BIGINT,
  usage_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) AS total_dist,
      COUNT(*) FILTER (WHERE status = 'used') AS total_use,
      COUNT(*) FILTER (WHERE status = 'expired') AS total_exp,
      COUNT(*) FILTER (WHERE status = 'available') AS total_avail
    FROM user_vouchers
    WHERE voucher_id = voucher_uuid
  )
  SELECT 
    total_dist,
    total_use,
    total_exp,
    total_avail,
    CASE 
      WHEN total_dist > 0 THEN ROUND((total_use::NUMERIC / total_dist::NUMERIC) * 100, 2)
      ELSE 0
    END AS usage_rate
  FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to distribute voucher to users
CREATE OR REPLACE FUNCTION distribute_voucher_to_users(
  voucher_uuid UUID,
  user_ids UUID[]
)
RETURNS TABLE (
  success BOOLEAN,
  distributed_count INTEGER,
  error_message TEXT
) AS $$
DECLARE
  new_count INTEGER := 0;
  existing_count INTEGER := 0;
BEGIN
  -- Check if voucher exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM vouchers 
    WHERE id = voucher_uuid AND active = true
  ) THEN
    RETURN QUERY SELECT false, 0, 'Voucher not found or inactive';
    RETURN;
  END IF;

  -- Insert new user_vouchers, skipping existing ones
  INSERT INTO user_vouchers (user_id, voucher_id, status)
  SELECT 
    unnest(user_ids),
    voucher_uuid,
    'available'
  ON CONFLICT (user_id, voucher_id) DO NOTHING;
  
  GET DIAGNOSTICS new_count = ROW_COUNT;

  RETURN QUERY SELECT true, new_count, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check voucher validity
CREATE OR REPLACE FUNCTION is_voucher_valid(voucher_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  voucher_record RECORD;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO voucher_record
  FROM vouchers
  WHERE id = voucher_uuid;

  -- Check if voucher exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if active
  IF NOT voucher_record.active THEN
    RETURN false;
  END IF;

  -- Check validity period if set
  IF voucher_record.valid_from IS NOT NULL 
     AND current_time < voucher_record.valid_from THEN
    RETURN false;
  END IF;

  IF voucher_record.valid_until IS NOT NULL 
     AND current_time > voucher_record.valid_until THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire vouchers
CREATE OR REPLACE FUNCTION auto_expire_vouchers()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update user_vouchers status to expired if voucher validity period has passed
  WITH expired_user_vouchers AS (
    UPDATE user_vouchers uv
    SET status = 'expired'
    FROM vouchers v
    WHERE uv.voucher_id = v.id
      AND uv.status = 'available'
      AND v.valid_until IS NOT NULL
      AND v.valid_until < NOW()
    RETURNING uv.id
  )
  SELECT COUNT(*) INTO expired_count FROM expired_user_vouchers;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE SCHEDULED JOB FOR AUTO-EXPIRATION (pg_cron extension required)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Run this manually if pg_cron is available:
-- 
-- SELECT cron.schedule(
--   'auto-expire-vouchers',
--   '0 0 * * *',  -- Run daily at midnight
--   'SELECT auto_expire_vouchers();'
-- );

-- ============================================================================
-- 7. SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- ============================================================================

-- Insert sample vouchers for testing
-- INSERT INTO vouchers (code, type, value, min_purchase, points_cost, active, description, valid_from, valid_until)
-- VALUES 
--   ('WELCOME10', 'fixed_amount', 10, 50, 100, true, '新用户欢迎优惠券', NOW(), NOW() + INTERVAL '30 days'),
--   ('SUMMER20', 'percentage', 20, 100, 200, true, '夏季促销20%折扣', NOW(), NOW() + INTERVAL '60 days'),
--   ('VIP50', 'fixed_amount', 50, 200, 500, true, 'VIP会员专属优惠券', NOW(), NOW() + INTERVAL '90 days')
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vouchers'
  AND column_name IN ('description', 'usage_limit', 'valid_from', 'valid_until', 'created_by', 'updated_at');

-- Verify indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('vouchers', 'user_vouchers')
  AND indexname LIKE 'idx_%';

-- Verify policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('vouchers', 'user_vouchers');

-- Verify functions created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_voucher_updated_at',
    'get_voucher_usage_stats',
    'distribute_voucher_to_users',
    'is_voucher_valid',
    'auto_expire_vouchers'
  );

-- ============================================================================
-- 9. ROLLBACK SCRIPT (For reference - DO NOT RUN unless needed)
-- ============================================================================

/*
-- Drop functions
DROP FUNCTION IF EXISTS auto_expire_vouchers();
DROP FUNCTION IF EXISTS is_voucher_valid(UUID);
DROP FUNCTION IF EXISTS distribute_voucher_to_users(UUID, UUID[]);
DROP FUNCTION IF EXISTS get_voucher_usage_stats(UUID);
DROP FUNCTION IF EXISTS update_voucher_updated_at();

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_voucher_timestamp ON vouchers;

-- Drop policies
DROP POLICY IF EXISTS user_vouchers_all_for_admins ON user_vouchers;
DROP POLICY IF EXISTS user_vouchers_update_own ON user_vouchers;
DROP POLICY IF EXISTS user_vouchers_select_own ON user_vouchers;
DROP POLICY IF EXISTS vouchers_all_for_admins ON vouchers;
DROP POLICY IF EXISTS vouchers_select_active_for_users ON vouchers;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_vouchers_used_at;
DROP INDEX IF EXISTS idx_user_vouchers_created_at;
DROP INDEX IF EXISTS idx_user_vouchers_status;
DROP INDEX IF EXISTS idx_user_vouchers_voucher_id;
DROP INDEX IF EXISTS idx_user_vouchers_user_id;
DROP INDEX IF EXISTS idx_vouchers_created_by;
DROP INDEX IF EXISTS idx_vouchers_validity;
DROP INDEX IF EXISTS idx_vouchers_code;
DROP INDEX IF EXISTS idx_vouchers_type;
DROP INDEX IF EXISTS idx_vouchers_active;

-- Remove columns (CAUTION: This will delete data)
-- ALTER TABLE vouchers
--   DROP COLUMN IF EXISTS updated_at,
--   DROP COLUMN IF EXISTS created_by,
--   DROP COLUMN IF EXISTS valid_until,
--   DROP COLUMN IF EXISTS valid_from,
--   DROP COLUMN IF EXISTS usage_limit,
--   DROP COLUMN IF EXISTS description;
*/

-- ============================================================================
-- END OF MIGRATION 006
-- ============================================================================
