# Change Log — 2025-12-12 — Web Push Notifications

---

## Summary

实现了完整的 **Web Push 通知系统**，使用户即使在关闭网页后也能收到实时通知。

**核心特性：**
- ✅ 浏览器原生 Web Push API（无需 Firebase）
- ✅ VAPID 协议支持
- ✅ Service Worker 后台监听
- ✅ 多设备订阅管理
- ✅ 自动清理失效订阅
- ✅ 通知点击跳转
- ✅ 优先级支持（low、normal、high、urgent）
- ✅ 完整的订阅UI组件
- ✅ 测试通知功能

**业务价值：**
- 订单完成即时通知（即使用户不在网页）
- 支付成功实时反馈
- 积分、优惠券到账提醒
- 系统公告推送
- 提升用户留存和复购率

---

## Changes Made

### 1. Service Worker

**文件：** `public/sw.js`

**功能：**
- 监听 Push 事件
- 显示通知
- 处理通知点击（跳转到对应页面）
- 处理通知关闭（记录用户行为）
- 根据通知类型自定义图标和行为

**核心代码：**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'String Service Platform';
  const options = {
    body: data.message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag,
    data: { url: data.url, ... },
    requireInteraction: data.priority === 'urgent',
    vibrate: data.priority === 'urgent' ? [200, 100, 200] : [100]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
```

**通知类型处理：**
- `order_completed` → 订单完成图标 + 强制交互
- `payment_verified` → 支付成功图标
- `low_stock` → 警告图标（管理员）
- `points_earned` → 积分图标
- `voucher_received` → 优惠券图标

---

### 2. Frontend Service

**文件：** `src/services/webPushService.ts`

**核心方法：**

| 方法 | 功能 | 返回值 |
|------|------|--------|
| `isWebPushSupported()` | 检查浏览器支持 | boolean |
| `requestNotificationPermission()` | 请求通知权限 | NotificationPermission |
| `registerServiceWorker()` | 注册 Service Worker | ServiceWorkerRegistration |
| `subscribeToPush()` | 订阅 Web Push | PushSubscription |
| `unsubscribeFromPush()` | 取消订阅 | boolean |
| `getPushSubscription()` | 获取当前订阅 | PushSubscription |
| `sendTestNotification()` | 发送测试通知 | boolean |

**订阅流程：**
```typescript
async function subscribeToPush() {
  // 1. 检查支持
  if (!isWebPushSupported()) throw Error('Not supported');
  
  // 2. 请求权限
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') throw Error('Permission denied');
  
  // 3. 注册 Service Worker
  const registration = await registerServiceWorker();
  
  // 4. 创建 Push 订阅
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  
  // 5. 保存到数据库
  await saveSubscriptionToDatabase(subscription);
  
  return subscription;
}
```

**数据库集成：**
- 订阅信息保存到 `notification_preferences.push_subscriptions` (JSONB字段)
- 支持多设备（用户可在多个浏览器/设备订阅）
- 自动去重（同endpoint不重复保存）

---

### 3. Edge Function

**文件：** `supabase/functions/send-web-push/index.ts`

**功能：**
- 接收推送请求
- 获取用户的订阅列表
- 使用 VAPID 签名发送通知
- 批量发送到所有设备
- 自动清理失效订阅

**API 接口：**
```typescript
POST /functions/v1/send-web-push

Request Body:
{
  userId: string;
  title: string;
  message: string;
  type?: string;  // 'order_completed', 'payment_verified', etc.
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  referenceType?: string;  // 'order', 'payment', etc.
  referenceId?: string;
  url?: string;
  image?: string;
  notificationId?: string;
}

Response:
{
  success: true,
  sent: 2,  // 成功发送数量
  failed: 0,  // 失败数量
  totalSubscriptions: 2
}
```

**错误处理：**
- 410 Gone → 订阅已过期，自动从数据库删除
- 其他错误 → 记录日志，但不删除订阅

---

### 4. UI Component

**文件：** `src/components/WebPushSubscription.tsx`

**功能：**
- 显示订阅状态
- 一键启用/禁用 Web Push
- 发送测试通知
- 浏览器支持检测
- 权限状态提示

**用户体验：**

**未订阅状态：**
```
🔔 浏览器推送通知
启用后可在订单状态更新时收到实时通知

[启用推送通知] 按钮
```

**已订阅状态：**
```
🔔 浏览器推送通知 ✅ 已启用
已启用 - 即使关闭页面也能收到通知

[发送测试通知] [禁用] 按钮

通知类型：
✅ 订单状态更新
✅ 支付确认
✅ 积分获得提醒
✅ 优惠券到账通知
✅ 系统公告

💡 即使关闭网页，您也能在浏览器或系统通知中心收到重要更新！
```

**权限被拒状态：**
```
🔕 通知权限被拒绝
您已拒绝通知权限。如需启用：
1. 点击地址栏的锁图标
2. 找到"通知"设置
3. 选择"允许"
4. 刷新页面
```

---

### 5. Integration

**集成到通知设置页面：**

文件：`src/components/NotificationSettingsPage.tsx`

```tsx
import WebPushSubscription from '@/components/WebPushSubscription';

// 在推送通知部分添加
<div className="mt-4">
  <WebPushSubscription />
</div>
```

**集成到 notificationService：**

新增方法：`sendWebPushNotification()`

```typescript
export async function sendWebPushNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  referenceType?: string;
  referenceId?: string;
  url?: string;
}) {
  // 调用 send-web-push Edge Function
}
```

---

## 技术细节

### VAPID (Voluntary Application Server Identification)

**什么是 VAPID？**
- Web Push 的身份验证协议
- 证明推送来自你的服务器（非第三方）
- 浏览器厂商要求必须使用

**生成 VAPID 密钥对：**
```bash
npm install web-push --save
node scripts/generate-vapid-keys.js
```

**输出：**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKxTw...  # 前端使用
VAPID_PRIVATE_KEY=abc123...            # 后端使用
```

---

### 数据库设计

**push_subscriptions 字段：**

类型：`JSONB`  
存储位置：`notification_preferences.push_subscriptions`

```json
[
  {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNc...base64...",
      "auth": "abc...base64..."
    }
  },
  {
    "endpoint": "https://updates.push.services.mozilla.com/...",
    "keys": {
      "p256dh": "BXy...base64...",
      "auth": "def...base64..."
    }
  }
]
```

**字段说明：**
- `endpoint`: 浏览器推送端点（唯一标识设备）
- `p256dh`: 公钥（Elliptic Curve Diffie-Hellman）
- `auth`: 认证密钥

---

### Service Worker 生命周期

```
用户访问网站
  ↓
注册 Service Worker (sw.js)
  ↓
Service Worker 安装 (install event)
  ↓
Service Worker 激活 (activate event)
  ↓
监听 Push 事件 (push event)
  ↓
显示通知 (showNotification)
  ↓
用户点击通知 (notificationclick event)
  ↓
跳转到指定页面 (clients.openWindow)
```

---

## 使用指南

### For Users (用户)

**启用 Web Push：**

1. 访问 `/profile/notifications` 或通知设置页
2. 在"推送通知"部分找到"浏览器推送通知"
3. 点击"启用推送通知"
4. 浏览器弹出权限请求，点击"允许"
5. 看到"已启用"状态，表示成功

**测试：**

1. 点击"发送测试通知"按钮
2. 浏览器或系统通知中心应显示测试通知
3. 点击通知可跳转回网站

**禁用：**

1. 点击"禁用"按钮
2. 订阅被移除，不再收到通知

---

### For Developers (开发者)

**发送 Web Push（代码集成）：**

```typescript
import { sendWebPushNotification } from '@/services/notificationService';

// 订单完成时发送通知
const { data, error } = await sendWebPushNotification({
  userId: order.user_id,
  title: '订单完成！🎉',
  message: `您的球拍已穿好线，欢迎前来取件。订单号：${order.id}`,
  type: 'order_completed',
  priority: 'high',
  referenceType: 'order',
  referenceId: order.id,
  url: `/orders/${order.id}`
});

if (error) {
  console.error('Web Push failed:', error);
}
```

**在订单流程中集成：**

示例：订单完成时同时发送 in-app、email、Web Push

```typescript
// 在 complete-order Edge Function 中
async function sendOrderCompletedNotifications(orderId: string, userId: string) {
  // 1. In-app notification
  await createNotification({
    user_id: userId,
    type: 'order_completed',
    title: '订单完成',
    message: '您的球拍已穿好线',
    reference_type: 'order',
    reference_id: orderId
  });

  // 2. Email notification
  await sendEmail({
    to: user.email,
    subject: '订单完成通知',
    template: 'order_completed',
    variables: { orderId, ... }
  });

  // 3. Web Push notification
  await sendWebPushNotification({
    userId,
    title: '订单完成！🎉',
    message: '您的球拍已穿好线，欢迎前来取件',
    type: 'order_completed',
    priority: 'high',
    referenceType: 'order',
    referenceId: orderId,
    url: `/orders/${orderId}`
  });
}
```

---

## 部署步骤

### 1. 生成 VAPID 密钥

```bash
cd c:\Users\tanli\Desktop\ArtSport\string
npm install web-push --save
node scripts/generate-vapid-keys.js
```

**复制输出的密钥对。**

---

### 2. 配置环境变量

**本地开发 (.env.local):**
```bash
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKxTw...
VAPID_PRIVATE_KEY=abc123...
```

**Supabase Edge Function secrets:**
```bash
supabase secrets set VAPID_PUBLIC_KEY=BKxTw...
supabase secrets set VAPID_PRIVATE_KEY=abc123...
```

---

### 3. 部署 Edge Function

```bash
supabase functions deploy send-web-push
```

**验证：**
```bash
# 测试 Edge Function
curl -X POST \
  https://your-project.supabase.co/functions/v1/send-web-push \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "Test",
    "message": "This is a test notification"
  }'
```

---

### 4. 添加图标文件

**必需图标：**

创建以下文件（或使用 placeholder）：

- `public/icon-192x192.png` - 通知主图标 (192x192px)
- `public/badge-72x72.png` - 通知徽章 (72x72px, 单色)
- `public/icons/order-complete.png` - 订单完成图标
- `public/icons/payment-success.png` - 支付成功图标
- `public/icons/warning.png` - 警告图标
- `public/icons/points.png` - 积分图标
- `public/icons/voucher.png` - 优惠券图标
- `public/icons/view.png` - 查看按钮图标
- `public/icons/dismiss.png` - 忽略按钮图标

**临时解决方案：**
```bash
# 复制现有图标或创建简单 SVG 占位符
cp public/logo.png public/icon-192x192.png
cp public/logo.png public/badge-72x72.png
mkdir -p public/icons
# ... 创建其他图标
```

---

### 5. 安装依赖并重启

```bash
npm install
npm run dev
```

---

## 测试指南

### 测试 1：订阅流程

**步骤：**
1. 访问 http://localhost:3000/profile/notifications
2. 找到"浏览器推送通知"部分
3. 点击"启用推送通知"
4. 浏览器弹出权限请求，点击"允许"
5. 状态变为"已启用"

**验证数据库：**
```sql
SELECT 
  user_id, 
  push_enabled,
  push_subscriptions
FROM notification_preferences
WHERE user_id = 'your-user-id';

-- push_enabled 应为 true
-- push_subscriptions 应包含订阅对象
```

---

### 测试 2：测试通知

**步骤：**
1. 在订阅状态下，点击"发送测试通知"
2. 浏览器或系统通知中心应显示通知
3. 通知内容：
   - 标题："测试通知"
   - 消息："这是一条测试通知..."
   - 图标：/icon-192x192.png

**点击通知：**
- 应跳转到首页 (/)
- 通知自动关闭

---

### 测试 3：后台通知

**步骤：**
1. 订阅 Web Push
2. **关闭浏览器标签页**（不是关闭浏览器）
3. 使用 Postman 或 curl 调用 Edge Function:

```bash
curl -X POST \
  http://localhost:54321/functions/v1/send-web-push \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "后台测试",
    "message": "这是一条后台推送通知",
    "type": "order_completed",
    "priority": "high"
  }'
```

**预期结果：**
- 即使标签页已关闭，系统通知中心仍显示通知
- 点击通知可重新打开网站

---

### 测试 4：多设备订阅

**步骤：**
1. 在 Chrome 浏览器订阅
2. 在 Firefox 浏览器（同一用户）订阅
3. 查看数据库：

```sql
SELECT 
  jsonb_array_length(push_subscriptions) as device_count,
  push_subscriptions
FROM notification_preferences
WHERE user_id = 'your-user-id';

-- device_count 应为 2
```

4. 发送一条通知
5. 两个浏览器都应收到通知

---

### 测试 5：取消订阅

**步骤：**
1. 在已订阅状态下，点击"禁用"
2. 状态变为"未启用"
3. 发送通知 → 不应收到

**验证数据库：**
```sql
SELECT push_subscriptions
FROM notification_preferences
WHERE user_id = 'your-user-id';

-- push_subscriptions 应为空数组 []
```

---

## 浏览器兼容性

| 浏览器 | 支持版本 | 备注 |
|--------|---------|------|
| Chrome | 50+ | ✅ 完全支持 |
| Firefox | 44+ | ✅ 完全支持 |
| Edge | 17+ | ✅ 完全支持 |
| Safari (macOS) | 16+ | ✅ 支持（需 macOS Ventura+） |
| Safari (iOS) | 16.4+ | ✅ 支持（需 iOS 16.4+） |
| Opera | 42+ | ✅ 完全支持 |
| Samsung Internet | 5+ | ✅ 完全支持 |

**不支持：**
- IE 11 及以下
- 旧版 Safari (macOS < Ventura, iOS < 16.4)

---

## 常见问题 (FAQ)

### Q1: 为什么用户刷新页面后订阅状态丢失？

**A:** Service Worker 可能未正确激活。检查：
```javascript
// 打开浏览器控制台
navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
  console.log('Service Worker:', reg);
  console.log('Active:', reg.active);
});
```

**解决方案：**
- 确保 `sw.js` 在 `public/` 目录
- 检查 Service Worker 是否有语法错误
- 尝试 Hard Refresh (Ctrl+Shift+R)

---

### Q2: 通知权限被拒绝后如何重置？

**Chrome:**
1. 点击地址栏左侧的锁图标
2. 找到"通知"设置
3. 选择"允许"
4. 刷新页面

**Firefox:**
1. 点击地址栏左侧的 ℹ️ 图标
2. 在"权限"部分找到"通知"
3. 移除阻止，选择"允许"
4. 刷新页面

---

### Q3: Edge Function 返回 "VAPID keys not configured"？

**A:** VAPID 密钥未设置。

**解决方案：**
```bash
# 检查本地环境变量
cat .env.local | grep VAPID

# 设置 Supabase secrets
supabase secrets set VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
supabase secrets set VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY

# 重新部署 Edge Function
supabase functions deploy send-web-push
```

---

### Q4: 订阅成功但收不到通知？

**检查清单：**

1. **用户偏好设置：**
```sql
SELECT push_enabled FROM notification_preferences WHERE user_id = '...';
-- 应为 true
```

2. **Edge Function 日志：**
```bash
supabase functions logs send-web-push
```

3. **浏览器控制台：**
```
Application → Service Workers → 查看是否有错误
```

4. **通知权限：**
```javascript
console.log(Notification.permission);  // 应为 "granted"
```

---

### Q5: 如何自定义通知样式？

**在 `public/sw.js` 中修改：**
```javascript
const options = {
  body: data.message,
  icon: '/custom-icon.png',  // 自定义图标
  badge: '/custom-badge.png',  // 自定义徽章
  image: data.image,  // 大图（可选）
  vibrate: [200, 100, 200],  // 震动模式
  actions: [  // 自定义按钮
    { action: 'view', title: '查看详情', icon: '/view.png' },
    { action: 'dismiss', title: '忽略', icon: '/dismiss.png' }
  ]
};
```

---

## 性能优化

### 1. Service Worker 缓存

```javascript
// 在 sw.js 中添加缓存策略
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('web-push-v1').then(cache => {
      return cache.addAll([
        '/icon-192x192.png',
        '/badge-72x72.png',
        '/icons/order-complete.png',
        // ... 其他静态资源
      ]);
    })
  );
});
```

### 2. 批量通知

```typescript
// 同时通知多个用户
async function notifyMultipleUsers(userIds: string[], notification: {
  title: string;
  message: string;
  type?: string;
}) {
  const promises = userIds.map(userId =>
    sendWebPushNotification({ userId, ...notification })
  );
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Sent to ${successful}/${userIds.length} users`);
}
```

### 3. 节流发送

避免短时间内发送大量相同通知：

```typescript
// 使用通知 tag 去重
await sendWebPushNotification({
  userId,
  title: '订单更新',
  message: '您有新的订单状态',
  tag: `order-${orderId}`,  // 相同 tag 的通知会被替换
  renotify: true
});
```

---

## 安全性

### 1. VAPID 密钥保护

**❌ 错误：**
- 将 VAPID_PRIVATE_KEY 暴露在前端代码
- 提交到 GitHub

**✅ 正确：**
- VAPID_PRIVATE_KEY 只存在于后端（Edge Function secrets）
- VAPID_PUBLIC_KEY 可以公开（前端使用）
- 使用环境变量

---

### 2. 订阅验证

Edge Function 必须验证用户身份：

```typescript
// 在 send-web-push Edge Function 中
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

### 3. 权限检查

只允许管理员或订单拥有者发送通知：

```typescript
// 检查用户是否有权限
const { data: order } = await supabase
  .from('orders')
  .select('user_id')
  .eq('id', orderId)
  .single();

if (order.user_id !== user.id && user.role !== 'admin') {
  return new Response('Forbidden', { status: 403 });
}
```

---

## 文件清单

| 文件 | 类型 | 行数 | 功能 |
|------|------|------|------|
| `public/sw.js` | Service Worker | 200+ | 接收并显示通知 |
| `src/services/webPushService.ts` | Frontend Service | 450+ | 订阅管理逻辑 |
| `src/components/WebPushSubscription.tsx` | React Component | 180+ | 订阅UI组件 |
| `src/components/NotificationSettingsPage.tsx` | React Component | 修改 | 集成订阅组件 |
| `src/services/notificationService.ts` | Frontend Service | 修改 | 添加发送方法 |
| `supabase/functions/send-web-push/index.ts` | Edge Function | 220+ | 后端推送逻辑 |
| `scripts/generate-vapid-keys.js` | Script | 20+ | 生成VAPID密钥 |
| `package.json` | Config | 修改 | 添加web-push依赖 |
| `docs/change_log_2025-12-12_web-push.md` | Documentation | 800+ | 本文档 |

**总计：** ~2000+ 行代码 + 文档

---

## 下一步

### 立即可做

1. **生成 VAPID 密钥：**
   ```bash
   node scripts/generate-vapid-keys.js
   ```

2. **安装依赖：**
   ```bash
   npm install
   ```

3. **启动开发服务器：**
   ```bash
   npm run dev
   ```

4. **测试订阅：**
   - 访问 http://localhost:3000/profile/notifications
   - 启用 Web Push
   - 发送测试通知

---

### 短期优化 (本周)

- [ ] 添加真实图标（替换 placeholder）
- [ ] 在订单完成时自动发送 Web Push
- [ ] 在支付成功时自动发送 Web Push
- [ ] 优化通知文案和样式

---

### 中期增强 (本月)

- [ ] 通知历史记录（已发送的 Web Push）
- [ ] 通知统计（打开率、点击率）
- [ ] 富文本通知（包含图片、按钮）
- [ ] 通知分组（按类型折叠）
- [ ] 静默通知（后台同步数据）

---

### 长期规划 (下季度)

- [ ] 个性化通知（根据用户行为）
- [ ] A/B 测试（通知文案优化）
- [ ] 推送时间智能优化（用户活跃时段）
- [ ] 跨平台统一（Web Push + App Push）

---

## 参考资料

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Status:** ✅ Implementation Complete  
**Ready for Testing:** Yes  
**Production Ready:** Pending icon assets and VAPID key generation  

---

**End of Change Log**
