-- ============================================================================
-- Migration: Phase 3.4 - Admin Package Management
-- Date: 2025-12-11
-- Description: Database schema changes for package management features
-- ============================================================================

-- 1. Add description column to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add updated_at column to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_packages_updated_at ON packages;
CREATE TRIGGER trigger_update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(active);
CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC);

-- Index on user_packages for common queries
CREATE INDEX IF NOT EXISTS idx_user_packages_package_id ON user_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_expiry ON user_packages(expiry);
CREATE INDEX IF NOT EXISTS idx_user_packages_remaining ON user_packages(remaining);

-- Composite index for active packages query
CREATE INDEX IF NOT EXISTS idx_user_packages_active 
ON user_packages(package_id, remaining, expiry) 
WHERE remaining > 0;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on packages table
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active packages (for user purchase flow)
CREATE POLICY IF NOT EXISTS "Anyone can view active packages"
ON packages FOR SELECT
TO authenticated
USING (active = true);

-- Policy: Admins can view all packages
CREATE POLICY IF NOT EXISTS "Admins can view all packages"
ON packages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can create packages
CREATE POLICY IF NOT EXISTS "Admins can create packages"
ON packages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy: Admins can update packages
CREATE POLICY IF NOT EXISTS "Admins can update packages"
ON packages FOR UPDATE
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

-- Policy: Super admins can delete packages
CREATE POLICY IF NOT EXISTS "Super admins can delete packages"
ON packages FOR DELETE
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

-- Function to get package sales summary
CREATE OR REPLACE FUNCTION get_package_sales_summary()
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  price NUMERIC,
  total_sold BIGINT,
  total_revenue NUMERIC,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS package_id,
    p.name AS package_name,
    p.price,
    COUNT(up.id) AS total_sold,
    COUNT(up.id) * p.price AS total_revenue,
    COUNT(CASE 
      WHEN up.remaining > 0 AND up.expiry > NOW() 
      THEN 1 
    END) AS active_users
  FROM packages p
  LEFT JOIN user_packages up ON p.id = up.package_id
  GROUP BY p.id, p.name, p.price
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'packages'
-- AND column_name IN ('description', 'updated_at');

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('packages', 'user_packages');

-- Test sales summary function
-- SELECT * FROM get_package_sales_summary();

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
/*
-- Remove function
DROP FUNCTION IF EXISTS get_package_sales_summary();

-- Remove trigger
DROP TRIGGER IF EXISTS trigger_update_packages_updated_at ON packages;
DROP FUNCTION IF EXISTS update_packages_updated_at();

-- Remove indexes
DROP INDEX IF EXISTS idx_packages_active;
DROP INDEX IF EXISTS idx_packages_name;
DROP INDEX IF EXISTS idx_packages_created_at;
DROP INDEX IF EXISTS idx_user_packages_package_id;
DROP INDEX IF EXISTS idx_user_packages_user_id;
DROP INDEX IF EXISTS idx_user_packages_expiry;
DROP INDEX IF EXISTS idx_user_packages_remaining;
DROP INDEX IF EXISTS idx_user_packages_active;

-- Remove RLS policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON packages;
DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
DROP POLICY IF EXISTS "Admins can create packages" ON packages;
DROP POLICY IF EXISTS "Admins can update packages" ON packages;
DROP POLICY IF EXISTS "Super admins can delete packages" ON packages;

-- Remove columns
ALTER TABLE packages DROP COLUMN IF EXISTS description;
ALTER TABLE packages DROP COLUMN IF EXISTS updated_at;
*/
