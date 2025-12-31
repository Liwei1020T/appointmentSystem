# SMS Notification System - Quick Start Guide

## 🚀 快速开始（5分钟设置）

### 第一步：注册 Twilio 账号

1. 访问 https://www.twilio.com/try-twilio
2. 注册免费试用账号（送 RM 50 额度）
3. 验证邮箱和手机号

### 第二步：获取凭证

在 Twilio Console Dashboard 获取：

```bash
TWILIO_ACCOUNT_SID=AC...  # 在 Dashboard 首页
TWILIO_AUTH_TOKEN=...      # 点击 "Show" 显示
```

### 第三步：购买马来西亚号码

1. 左侧菜单：Phone Numbers → Buy a Number
2. 选择国家：Malaysia (+60)
3. 搜索并购买（约 $1/月）
4. 复制号码（格式：+60XXXXXXXXX）

```bash
TWILIO_FROM_NUMBER=+60XXXXXXXXX
```

### 第四步：配置环境变量

**本地开发** (`.env`):
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+60...
```

**Supabase 生产环境**:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=AC...
supabase secrets set TWILIO_AUTH_TOKEN=...
supabase secrets set TWILIO_FROM_NUMBER=+60...
```

### 第五步：部署数据库迁移

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f sql/migrations/010_sms_system.sql
```

或使用 Supabase Dashboard → SQL Editor 运行文件内容。

### 第六步：部署 Edge Function

```bash
supabase functions deploy send-sms
```

### 第七步：测试发送

```bash
curl -X POST \
  https://xxx.supabase.co/functions/v1/send-sms \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "eventType": "order_completed",
    "variables": {
      "user_name": "Test User",
      "order_number": "ORD-001"
    },
    "phoneNumber": "+60123456789"
  }'
```

成功返回：
```json
{
  "success": true,
  "messageId": "SM...",
  "phoneNumber": "+60123456789"
}
```

---

## 📱 用户如何启用 SMS

1. 登录账号
2. 前往 `/profile/notifications`
3. 在 "SMS 通知" 区域：
   - 开启 "启用 SMS 通知"
   - 选择接收类型（订单更新、支付更新）
4. 点击 "保存设置"

**重要**：用户需要在个人资料中设置手机号（`users.phone`）。

---

## 🧪 快速测试

### 测试 1：手动更新用户手机号

```sql
UPDATE users 
SET phone = '+60123456789' 
WHERE email = 'test@example.com';
```

### 测试 2：完成一个订单

```sql
-- 查找待完成订单
SELECT id, order_number, user_id, status 
FROM orders 
WHERE status = 'in_progress' 
LIMIT 1;

-- 在管理后台完成订单
-- 或直接调用 Edge Function
curl -X POST \
  https://xxx.supabase.co/functions/v1/complete-order \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "order-uuid"}'
```

用户应在 5-10 秒内收到短信：
> "Hi Test User! Your String order #ORD-001 is ready for pickup! Thank you!"

### 测试 3：查看发送日志

```sql
SELECT 
  phone_number,
  event_type,
  status,
  content,
  created_at
FROM sms_logs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 💰 成本估算

### Twilio 马来西亚 SMS 费率

- **价格**: RM 0.30/条
- **试用**: 免费 RM 50（约 166 条短信）
- **月费**: 号码租金 ~$1/月 (RM 4.5)

### 使用预估

| 场景 | SMS/月 | 成本/月 |
|------|--------|---------|
| 小型店铺（10订单/天） | 600 | RM 180 + RM 4.5 |
| 中型店铺（50订单/天） | 3,000 | RM 900 + RM 4.5 |
| 大型店铺（100订单/天） | 6,000 | RM 1,800 + RM 4.5 |

**节省成本的方法**:
- 只为重要事件发送（订单完成、支付确认）
- 不发送促销类 SMS
- 允许用户选择退出

---

## 🔧 常见问题

### Q1: 试用账号限制？

**A**: 试用账号只能发送到已验证的号码。

**解决方案**:
1. 在 Twilio Console → Phone Numbers → Verified Caller IDs 添加测试号码
2. 或升级到付费账号（无限制）

### Q2: 短信发送失败？

**A**: 检查以下项：

1. **Supabase Logs**: 查看 `send-sms` 函数日志
2. **Twilio Logs**: Console → Monitor → Logs → Messaging
3. **号码格式**: 确保是 +60 开头
4. **用户设置**: 检查 `notification_preferences.sms_enabled`
5. **凭证**: 验证 `supabase secrets list`

### Q3: 如何测试而不发送真实短信？

**A**: 使用 Twilio Test Credentials（仅开发）

```bash
# 测试凭证（不会真发送）
TWILIO_ACCOUNT_SID=ACxxxxxxxxx (Test Credentials from Console)
TWILIO_AUTH_TOKEN=test_token
TWILIO_FROM_NUMBER=+15005550006  # Twilio 测试号码
```

所有发送都会成功返回，但不会真的发送短信。

### Q4: 支持其他国家号码吗？

**A**: 可以！修改 `formatMalaysianPhoneNumber()` 函数：

```typescript
// 使用国际库
import { parsePhoneNumber } from 'libphonenumber-js';

function formatPhoneNumber(phone: string, country: string = 'MY'): string {
  const parsed = parsePhoneNumber(phone, country);
  return parsed.format('E.164'); // +60123456789
}
```

---

## 📊 监控仪表板（可选）

创建 `/admin/sms-stats` 页面：

```tsx
import { getSmsStats } from '@/services/notificationService';

export default async function SMSStatsPage() {
  const stats = await getSmsStats();
  
  return (
    <div>
      <h1>SMS 分析</h1>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总发送" value={stats.total_sent} />
        <StatCard title="成功送达" value={stats.total_delivered} />
        <StatCard title="失败" value={stats.total_failed} />
        <StatCard title="送达率" value={`${stats.delivery_rate}%`} />
      </div>
      <div className="mt-4">
        <p>估算成本: RM {stats.total_cost}</p>
      </div>
    </div>
  );
}
```

---

## 🛠 升级到生产环境

### 1. 升级 Twilio 账号

- Console → Billing → Upgrade Account
- 添加信用卡
- 充值 RM 100+

### 2. 移除试用限制

升级后可发送到任意有效号码，无需预先验证。

### 3. 设置 Billing Alerts

- Console → Billing → Notifications
- 设置预算警报（如超过 RM 1000/月）

### 4. 启用 Delivery Webhooks（可选）

获取实时送达状态：

1. Console → Phone Numbers → 选择号码 → Messaging
2. "A MESSAGE COMES IN" → Webhook URL:
   ```
   https://xxx.supabase.co/functions/v1/twilio-webhook
   ```
3. 创建 webhook 函数更新 `sms_logs.status`

---

## 📞 技术支持

- **Twilio 支持**: https://support.twilio.com/
- **Supabase Discord**: https://discord.supabase.com/
- **项目文档**: `docs/change_log_2025-01-12_sms-notifications.md`

---

**Happy SMS Sending! 🎉**
