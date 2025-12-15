-- ============================================================================
-- Migration: Phase 3.3 - Admin Inventory Management
-- Date: 2025-12-11
-- Description: Database schema for stock logging and inventory management
-- ============================================================================

-- 1. Create stock_log table for tracking all stock changes
CREATE TABLE IF NOT EXISTS stock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  string_id UUID NOT NULL REFERENCES string_inventory(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('addition', 'deduction', 'adjustment', 'return')),
  reason TEXT,
  admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE stock_log IS 'Logs all stock quantity changes for audit trail';

-- Add comments to columns
COMMENT ON COLUMN stock_log.change_amount IS 'Positive for additions, negative for deductions';
COMMENT ON COLUMN stock_log.type IS 'Type of stock change: addition, deduction, adjustment, or return';
COMMENT ON COLUMN stock_log.reason IS 'Explanation for the stock change';
COMMENT ON COLUMN stock_log.admin_id IS 'Admin user who performed the stock change';

-- 2. Add indexes for performance
-- Index on string_id for filtering logs by string
CREATE INDEX IF NOT EXISTS idx_stock_log_string_id 
ON stock_log(string_id);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_stock_log_created_at 
ON stock_log(created_at DESC);

-- Composite index for common queries (string + date)
CREATE INDEX IF NOT EXISTS idx_stock_log_string_created 
ON stock_log(string_id, created_at DESC);

-- Index on admin_id for filtering by admin
CREATE INDEX IF NOT EXISTS idx_stock_log_admin_id 
ON stock_log(admin_id);

-- Index on type for filtering by change type
CREATE INDEX IF NOT EXISTS idx_stock_log_type 
ON stock_log(type);

-- 3. Add missing columns to string_inventory if needed
-- Add description column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'string_inventory' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE string_inventory ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add updated_at column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'string_inventory' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE string_inventory ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 4. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to string_inventory table
DROP TRIGGER IF EXISTS trigger_update_string_inventory_updated_at ON string_inventory;
CREATE TRIGGER trigger_update_string_inventory_updated_at
  BEFORE UPDATE ON string_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Add indexes to string_inventory for better performance
-- Index on name for search
CREATE INDEX IF NOT EXISTS idx_string_inventory_name 
ON string_inventory(name);

-- Index on brand for filtering
CREATE INDEX IF NOT EXISTS idx_string_inventory_brand 
ON string_inventory(brand);

-- Composite index for search (name + brand)
CREATE INDEX IF NOT EXISTS idx_string_inventory_search 
ON string_inventory(name, brand);

-- Index on stock_quantity for low stock queries
CREATE INDEX IF NOT EXISTS idx_string_inventory_stock 
ON string_inventory(stock_quantity);

-- Partial index for low stock alerts (only strings with stock < minimum_stock)
CREATE INDEX IF NOT EXISTS idx_string_inventory_low_stock 
ON string_inventory(stock_quantity, minimum_stock) 
WHERE stock_quantity < minimum_stock;

-- ============================================================================
-- RLS Policies for stock_log table
-- ============================================================================

-- Enable RLS on stock_log
ALTER TABLE stock_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all stock logs
CREATE POLICY IF NOT EXISTS "Admins can view stock logs"
ON stock_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can insert stock logs
CREATE POLICY IF NOT EXISTS "Admins can create stock logs"
ON stock_log FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: No one can update stock logs (immutable audit trail)
-- Intentionally no UPDATE policy - stock logs should be append-only

-- Policy: Only super admins can delete stock logs
CREATE POLICY IF NOT EXISTS "Super admins can delete stock logs"
ON stock_log FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ============================================================================
-- RLS Policies for string_inventory table (if not exists)
-- ============================================================================

-- Enable RLS on string_inventory (if not already enabled)
ALTER TABLE string_inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view string inventory (for booking flow)
CREATE POLICY IF NOT EXISTS "Anyone can view string inventory"
ON string_inventory FOR SELECT
TO authenticated
USING (true);

-- Policy: Admins can insert new strings
CREATE POLICY IF NOT EXISTS "Admins can create strings"
ON string_inventory FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can update strings
CREATE POLICY IF NOT EXISTS "Admins can update strings"
ON string_inventory FOR UPDATE
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

-- Policy: Super admins can delete strings
CREATE POLICY IF NOT EXISTS "Super admins can delete strings"
ON string_inventory FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  stock_quantity INTEGER,
  minimum_stock INTEGER,
  deficit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.name,
    si.brand,
    si.stock_quantity,
    si.minimum_stock,
    (si.minimum_stock - si.stock_quantity) AS deficit
  FROM string_inventory si
  WHERE si.stock_quantity < si.minimum_stock
  AND si.minimum_stock > 0
  ORDER BY deficit DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stock movement summary
CREATE OR REPLACE FUNCTION get_stock_movement_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  string_id UUID,
  string_name TEXT,
  brand TEXT,
  total_additions INTEGER,
  total_deductions INTEGER,
  net_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id AS string_id,
    si.name AS string_name,
    si.brand,
    COALESCE(SUM(CASE WHEN sl.change_amount > 0 THEN sl.change_amount ELSE 0 END), 0)::INTEGER AS total_additions,
    COALESCE(SUM(CASE WHEN sl.change_amount < 0 THEN ABS(sl.change_amount) ELSE 0 END), 0)::INTEGER AS total_deductions,
    COALESCE(SUM(sl.change_amount), 0)::INTEGER AS net_change
  FROM string_inventory si
  LEFT JOIN stock_log sl ON si.id = sl.string_id
  WHERE sl.created_at BETWEEN start_date AND end_date
  OR sl.created_at IS NULL
  GROUP BY si.id, si.name, si.brand
  ORDER BY ABS(net_change) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Verification Queries
-- Run these to verify the migration was successful
-- ============================================================================

-- Check if stock_log table exists
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name = 'stock_log';

-- Check stock_log columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'stock_log'
-- ORDER BY ordinal_position;

-- Check indexes on stock_log
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'stock_log';

-- Check string_inventory columns
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'string_inventory'
-- ORDER BY ordinal_position;

-- Test get_low_stock_items function
-- SELECT * FROM get_low_stock_items();

-- Test get_stock_movement_summary function
-- SELECT * FROM get_stock_movement_summary();

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample strings (uncomment to use)
/*
INSERT INTO string_inventory (name, brand, cost_price, selling_price, stock_quantity, minimum_stock, description)
VALUES
  ('BG80', 'YONEX', 15.00, 25.00, 20, 5, '专业级羽毛球线，高弹性，适合进攻型球员'),
  ('BG65', 'YONEX', 12.00, 20.00, 15, 5, '经典耐打线，适合初中级球员'),
  ('NBG99', 'LI-NING', 18.00, 28.00, 10, 5, '高端球线，出色的击球声音和手感'),
  ('Aerobite', 'YONEX', 20.00, 32.00, 3, 5, '混合线，外松内紧，综合性能优异'),
  ('Exbolt 63', 'VICTOR', 10.00, 18.00, 0, 5, '高性价比球线，适合业余球员')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
/*
-- Remove functions
DROP FUNCTION IF EXISTS get_stock_movement_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_low_stock_items();

-- Remove trigger
DROP TRIGGER IF EXISTS trigger_update_string_inventory_updated_at ON string_inventory;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove indexes
DROP INDEX IF EXISTS idx_stock_log_string_id;
DROP INDEX IF EXISTS idx_stock_log_created_at;
DROP INDEX IF EXISTS idx_stock_log_string_created;
DROP INDEX IF EXISTS idx_stock_log_admin_id;
DROP INDEX IF EXISTS idx_stock_log_type;
DROP INDEX IF EXISTS idx_string_inventory_name;
DROP INDEX IF EXISTS idx_string_inventory_brand;
DROP INDEX IF EXISTS idx_string_inventory_search;
DROP INDEX IF EXISTS idx_string_inventory_stock;
DROP INDEX IF EXISTS idx_string_inventory_low_stock;

-- Remove RLS policies
DROP POLICY IF EXISTS "Admins can view stock logs" ON stock_log;
DROP POLICY IF EXISTS "Admins can create stock logs" ON stock_log;
DROP POLICY IF EXISTS "Super admins can delete stock logs" ON stock_log;
DROP POLICY IF EXISTS "Anyone can view string inventory" ON string_inventory;
DROP POLICY IF EXISTS "Admins can create strings" ON string_inventory;
DROP POLICY IF EXISTS "Admins can update strings" ON string_inventory;
DROP POLICY IF EXISTS "Super admins can delete strings" ON string_inventory;

-- Remove columns from string_inventory
ALTER TABLE string_inventory DROP COLUMN IF EXISTS description;
ALTER TABLE string_inventory DROP COLUMN IF EXISTS updated_at;

-- Remove stock_log table
DROP TABLE IF EXISTS stock_log;
*/
