# ⚡ Quick Start - 手动支付系统

**5 分钟快速启动指南**  
**String Service Platform - Manual Payment System**

---

## 🎯 快速启动步骤

### Step 1: 配置环境变量 (2 分钟)

```bash
# 1. 复制环境变量模板
cp .env.example .env.local

# 2. 编辑 .env.local，填入以下必填项：
# - NEXT_PUBLIC_SUPABASE_URL（从 Supabase Dashboard 获取）
# - NEXT_PUBLIC_SUPABASE_ANON_KEY（从 Supabase Dashboard 获取）
# - NEXT_PUBLIC_MERCHANT_NAME（你的商家名称）
# - NEXT_PUBLIC_MERCHANT_PHONE（你的联系电话）
```

**最小配置示例：**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_MERCHANT_NAME=String Service
NEXT_PUBLIC_MERCHANT_PHONE=+60123456789
```

---

### Step 2: 配置 Supabase Storage (2 分钟)

**选项 A：使用 SQL 脚本（推荐）**

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制粘贴 `scripts/setup-storage.sql` 内容
4. 点击 Run 执行

**选项 B：手动创建**

1. 进入 Supabase Dashboard > Storage
2. 点击 "New bucket"
3. 配置：
   - Name: `receipts`
   - Public: **OFF** (关闭)
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`
4. 保存后前往 Policies 页面应用 RLS 策略（见 `setup-storage.sql`）

---

### Step 3: 添加 TNG 收款码 (1 分钟)

```bash
# 将你的 TNG 收款码图片放到这里：
# public/images/tng-qr-code.png

# 临时使用占位图（用于开发测试）：
# 系统已自动生成 tng-qr-code-placeholder.svg
# 开发时会显示占位图
```

**获取真实 TNG 收款码：**
1. 打开 TNG eWallet app
2. 点击 "Receive Money" 或 "我的二维码"
3. 保存/截图二维码
4. 重命名为 `tng-qr-code.png` 并放入 `public/images/`

---

### Step 4: 启动开发服务器 (<1 分钟)

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev

# 打开浏览器
# http://localhost:3000
```

---

## ✅ 验证配置是否成功

### 测试用户端流程：

1. **注册/登录**
   - 访问 `http://localhost:3000/signup`
   - 创建测试账号

2. **创建订单**
   - 访问 `http://localhost:3000/booking`
   - 选择球线、拉力、时间
   - 提交订单

3. **查看支付页面**
   - 应该能看到 TNG 收款码
   - 能看到支付说明
   - 能看到上传收据按钮

4. **上传收据**
   - 准备一张测试图片（JPG/PNG）
   - 拖拽或点击上传
   - 应显示上传成功消息

### 测试管理端流程：

1. **创建管理员账号**
   ```sql
   -- 在 Supabase SQL Editor 执行：
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

2. **登录管理后台**
   - 访问 `http://localhost:3000/admin/login`
   - 使用管理员账号登录

3. **审核收据**
   - 进入 Orders 页面
   - 找到有待审核收据的订单
   - 点击查看收据
   - 点击 "Approve" 或 "Reject"
   - 验证订单状态更新

---

## 🐛 常见问题排查

### 问题 1: QR Code 不显示

**症状：** 支付页面显示 "QR code temporarily unavailable"

**解决方案：**
- 确认 `public/images/tng-qr-code.png` 文件存在
- 或使用占位图：`tng-qr-code-placeholder.svg`
- 检查文件权限
- 重启开发服务器

---

### 问题 2: 收据上传失败

**症状：** 上传时显示错误

**检查清单：**
1. Supabase Storage bucket 是否已创建？
   ```bash
   # 在 Supabase Dashboard > Storage 检查
   ```

2. RLS 策略是否已应用？
   ```sql
   -- 在 Supabase SQL Editor 执行：
   SELECT * FROM storage.buckets WHERE id = 'receipts';
   ```

3. 用户是否已登录？
   ```javascript
   // 在浏览器 Console 检查：
   console.log(supabase.auth.getUser());
   ```

4. 文件大小是否超过 5MB？
5. 文件格式是否正确（JPG/PNG/WEBP/PDF）？

---

### 问题 3: 管理员看不到收据

**症状：** Admin 无法查看上传的收据

**解决方案：**
1. 确认用户 role 为 'admin'：
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your-email';
   ```

2. 检查 Storage RLS 策略是否包含 admin 权限

3. 清除浏览器缓存

---

### 问题 4: 环境变量不生效

**症状：** 修改 .env.local 后无变化

**解决方案：**
```bash
# 1. 确认文件名正确：.env.local（不是 .env）
# 2. 确认变量名以 NEXT_PUBLIC_ 开头（客户端变量）
# 3. 重启开发服务器
npm run dev
```

---

## 📚 下一步

配置完成后，建议阅读：

1. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - 完整部署检查清单
2. **[MANUAL_PAYMENT_TESTING_GUIDE.md](./MANUAL_PAYMENT_TESTING_GUIDE.md)** - 详细测试指南
3. **[change_log_2025-12-12_manual-payment.md](./change_log_2025-12-12_manual-payment.md)** - 功能变更日志

---

## 🆘 需要帮助？

如果遇到问题：

1. 检查 Supabase Dashboard 的日志
2. 检查浏览器 Console 的错误信息
3. 查看 [MANUAL_PAYMENT_TESTING_GUIDE.md](./MANUAL_PAYMENT_TESTING_GUIDE.md) 的故障排除部分
4. 确认所有迁移脚本已执行

---

**🎉 恭喜！手动支付系统已配置完成！**

现在可以开始测试完整的支付流程了。
