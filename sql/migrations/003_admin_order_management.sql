-- ============================================================================
-- Migration: Phase 3.2 - Admin Order Management
-- Date: 2025-12-11
-- Description: Database schema changes for admin order management features
-- ============================================================================

-- 1. Add admin_notes column to orders table
-- This allows admins to add notes when updating order status
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Create RPC function for stock deduction
-- This function is called when an order is marked as completed
-- It decrements the stock quantity and optionally creates a stock log
CREATE OR REPLACE FUNCTION decrement_stock(
  string_id UUID,
  quantity INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock quantity
  UPDATE string_inventory
  SET 
    stock_quantity = stock_quantity - quantity,
    updated_at = NOW()
  WHERE id = string_id;
  
  -- Verify stock was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'String inventory item not found: %', string_id;
  END IF;
  
  -- Check for negative stock (optional warning)
  IF (SELECT stock_quantity FROM string_inventory WHERE id = string_id) < 0 THEN
    RAISE WARNING 'Stock quantity is negative for string_id: %', string_id;
  END IF;
  
  -- Optional: Create stock log entry
  -- Uncomment if stock_log table exists
  /*
  INSERT INTO stock_log (
    string_id,
    change_amount,
    type,
    reason,
    created_at
  )
  VALUES (
    string_id,
    -quantity,
    'deduction',
    'Order completion',
    NOW()
  );
  */
END;
$$;

-- 3. Add index on orders.status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 4. Add index on orders.created_at for faster date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 5. Add composite index for common queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
ON orders(status, created_at DESC);

-- 6. Add index on orders.user_id for user-based filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================================================
-- Optional: Create stock_log table if it doesn't exist
-- Uncomment this section if you want to track all stock changes
-- ============================================================================
/*
CREATE TABLE IF NOT EXISTS stock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  string_id UUID NOT NULL REFERENCES string_inventory(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('addition', 'deduction', 'adjustment', 'return')),
  reason TEXT,
  admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for stock_log queries
CREATE INDEX IF NOT EXISTS idx_stock_log_string_id ON stock_log(string_id);
CREATE INDEX IF NOT EXISTS idx_stock_log_created_at ON stock_log(created_at DESC);
*/

-- ============================================================================
-- RLS Policies for Admin Access
-- Ensure only admins can access order management functions
-- ============================================================================

-- Allow admins to view all orders
CREATE POLICY IF NOT EXISTS "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update orders
CREATE POLICY IF NOT EXISTS "Admins can update orders"
ON orders FOR UPDATE
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

-- Allow admins to delete cancelled orders
CREATE POLICY IF NOT EXISTS "Admins can delete cancelled orders"
ON orders FOR DELETE
TO authenticated
USING (
  status = 'cancelled'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- Verification Queries
-- Run these to verify the migration was successful
-- ============================================================================

-- Check if admin_notes column exists
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'admin_notes';

-- Check if decrement_stock function exists
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name = 'decrement_stock';

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'orders';

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
/*
-- Remove admin_notes column
ALTER TABLE orders DROP COLUMN IF EXISTS admin_notes;

-- Remove decrement_stock function
DROP FUNCTION IF EXISTS decrement_stock(UUID, INTEGER);

-- Remove indexes
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_status_created_at;
DROP INDEX IF EXISTS idx_orders_user_id;

-- Remove RLS policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete cancelled orders" ON orders;

-- Drop stock_log table (if created)
-- DROP TABLE IF EXISTS stock_log;
*/
