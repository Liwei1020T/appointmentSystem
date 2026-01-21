-- Migration: 016_welcome_voucher_fields
-- Description: 添加新用户欢迎礼包相关字段到 vouchers 表
-- Date: 2025-01-21

-- 添加优惠券标签字段
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

-- 添加首单专属标记
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS is_first_order_only BOOLEAN DEFAULT FALSE;

-- 添加自动发放标记
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS is_auto_issue BOOLEAN DEFAULT FALSE;

-- 添加发放后有效天数（覆盖 valid_until）
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS validity_days INTEGER;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_vouchers_tag ON vouchers(tag);
CREATE INDEX IF NOT EXISTS idx_vouchers_auto_issue ON vouchers(is_auto_issue) WHERE is_auto_issue = TRUE;

-- 插入新用户欢迎优惠券（仅当不存在时）
INSERT INTO vouchers (
  id,
  code,
  name,
  type,
  value,
  min_purchase,
  max_uses,
  points_cost,
  valid_from,
  valid_until,
  active,
  tag,
  is_first_order_only,
  is_auto_issue,
  validity_days,
  created_at
)
SELECT
  gen_random_uuid(),
  'WELCOME3',
  '新用户首单立减 RM3',
  'fixed_amount',
  3.00,
  0,
  NULL,
  0,
  NOW(),
  NOW() + INTERVAL '2 years',
  TRUE,
  'welcome',
  TRUE,
  TRUE,
  7,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM vouchers WHERE code = 'WELCOME3'
);

COMMENT ON COLUMN vouchers.tag IS '优惠券标签: welcome, referral, review, promotion';
COMMENT ON COLUMN vouchers.is_first_order_only IS '是否仅限首单使用';
COMMENT ON COLUMN vouchers.is_auto_issue IS '是否在注册时自动发放';
COMMENT ON COLUMN vouchers.validity_days IS '发放后有效天数（覆盖 valid_until）';
