-- Migration: 019_order_estimated_completion
-- Description: 添加订单预计完成时间字段
-- Date: 2025-01-21

-- 添加预计完成时间字段
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMPTZ;

-- 创建索引（用于按预计完成时间排序）
CREATE INDEX IF NOT EXISTS idx_orders_estimated_completion ON orders(estimated_completion_at)
WHERE status IN ('pending', 'in_progress');

COMMENT ON COLUMN orders.estimated_completion_at IS '预计完成时间（订单创建时计算）';

-- 为现有未完成订单设置预计完成时间（基于创建时间 + 3天）
UPDATE orders
SET estimated_completion_at = created_at + INTERVAL '3 days'
WHERE status IN ('pending', 'in_progress')
  AND estimated_completion_at IS NULL;
