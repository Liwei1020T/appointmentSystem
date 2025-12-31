-- Prisma 数据库初始化脚本
-- 手动运行此脚本或使用 npx prisma db push

-- 注意: Prisma 会自动创建表结构，此脚本主要用于初始数据

-- ============================================
-- 创建初始管理员账号
-- ============================================
-- 密码: admin123 (bcrypt hash)
-- 请在生产环境中更改密码！

INSERT INTO users (id, email, password, full_name, role, points, referral_code, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@string.com',
  '$2b$10$rO5gZz6CxGXKfZ2u9vYzLePVKx9L3Y5.Jv0N8xkQqZWNx1yG4yB2K',  -- admin123
  '系统管理员',
  'admin',
  0,
  'ADMIN001',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 初始化系统设置
-- ============================================

INSERT INTO system_settings (key, value, description, updated_at)
VALUES 
  ('referral_reward', '50', '推荐奖励积分数', NOW()),
  ('low_stock_threshold', '5', '低库存警告阈值（米）', NOW()),
  ('order_auto_complete_days', '7', '订单自动完成天数', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- 示例套餐数据
-- ============================================

INSERT INTO packages (id, name, description, times, price, original_price, validity_days, active, created_at, updated_at)
VALUES
  (gen_random_uuid(), '体验套餐', '适合新手体验', 3, 90.00, 105.00, 30, true, NOW(), NOW()),
  (gen_random_uuid(), '基础套餐', '适合普通玩家', 5, 140.00, 175.00, 60, true, NOW(), NOW()),
  (gen_random_uuid(), '高级套餐', '适合高频玩家', 10, 260.00, 350.00, 90, true, NOW(), NOW()),
  (gen_random_uuid(), '年度套餐', '最超值选择', 20, 480.00, 700.00, 365, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 示例球线库存
-- ============================================

INSERT INTO string_inventory (id, model, brand, cost_price, selling_price, stock, minimum_stock, color, gauge, active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'BG66 Ultimax', 'YONEX', 25.00, 35.00, 100, 20, '白色', '0.65mm', true, NOW(), NOW()),
  (gen_random_uuid(), 'NBG98', 'YONEX', 28.00, 38.00, 80, 20, '黄色', '0.66mm', true, NOW(), NOW()),
  (gen_random_uuid(), 'Aerobite', 'YONEX', 32.00, 42.00, 60, 15, '白/蓝', '0.67/0.61mm', true, NOW(), NOW()),
  (gen_random_uuid(), 'HiQua Ultra', 'Li-Ning', 22.00, 32.00, 120, 25, '白色', '0.67mm', true, NOW(), NOW()),
  (gen_random_uuid(), 'No.1 Turbo', 'Li-Ning', 25.00, 35.00, 90, 20, '金色', '0.68mm', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 示例优惠券
-- ============================================

INSERT INTO vouchers (id, code, name, type, value, min_purchase, max_uses, used_count, points_cost, valid_from, valid_until, active, created_at)
VALUES
  (gen_random_uuid(), 'WELCOME10', '新用户优惠', 'fixed_amount', 10.00, 30.00, 100, 0, 0, NOW(), NOW() + INTERVAL '90 days', true, NOW()),
  (gen_random_uuid(), 'SAVE20', '满减20', 'fixed_amount', 20.00, 100.00, NULL, 0, 50, NOW(), NOW() + INTERVAL '90 days', true, NOW()),
  (gen_random_uuid(), 'VIP15', '会员专享85折', 'percentage', 15.00, 50.00, NULL, 0, 100, NOW(), NOW() + INTERVAL '90 days', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 完成
-- ============================================

-- 查询统计
SELECT 'Initialization Complete' AS status;
SELECT COUNT(*) AS admin_users FROM users WHERE role = 'admin';
SELECT COUNT(*) AS packages FROM packages WHERE active = true;
SELECT COUNT(*) AS strings FROM string_inventory WHERE active = true;
SELECT COUNT(*) AS vouchers FROM vouchers WHERE active = true;
