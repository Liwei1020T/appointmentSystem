-- 创建管理员账户
-- 密码: admin123 (已加密)

-- 方式1: 插入新的管理员账户
INSERT INTO users (
  id,
  email,
  full_name,
  phone,
  password_hash,
  role,
  points_balance,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'System Admin',
  '+60123456789',
  -- 这是 'admin123' 的 bcrypt hash
  '$2b$10$YourHashHere',
  'admin',
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE 
SET role = 'admin';

-- 方式2: 将现有用户提升为管理员（请替换邮箱）
UPDATE users 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- 方式3: 查看所有用户及其角色
SELECT id, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC;
