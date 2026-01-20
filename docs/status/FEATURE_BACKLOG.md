# 功能待办清单 (Feature Backlog)

> 上次更新: 2026-01-20

---

## 🔥 高优先级

### 1. WhatsApp 一键通知按钮

**位置**：管理后台 - 订单详情页

**功能描述**：
- 在订单详情页添加 "WhatsApp 通知客户" 按钮
- 点击后跳转 WhatsApp 并带上预设消息
- 管理员只需按发送即可

**技术实现**：
```tsx
// 使用 wa.me 链接
const phone = order.user.phone.replace(/^0/, '60'); // 转换为国际格式
const message = encodeURIComponent(`您好！您的球拍已穿好，可以来取拍了 🏸\n\n订单号：${order.order_number}`);
const waLink = `https://wa.me/${phone}?text=${message}`;
window.open(waLink, '_blank');
```

**按钮样式**：
- 绿色 WhatsApp 品牌色 (#25D366)
- 图标：WhatsApp logo
- 文字："WhatsApp 通知"

**消息模板**：
| 场景 | 消息内容 |
|------|----------|
| 穿线完成 | "您好！您的球拍已穿好，可以来取拍了 🏸\n订单号：{order_number}" |
| 收到球拍 | "您好！已收到您的球拍，预计 {eta} 完成" |
| 支付确认 | "收到付款 RM{amount}，谢谢！" |

**预计工时**：1-2 小时

**状态**：⏳ 待开发

---

## 🟡 中优先级

### 2. FCM 推送通知

**功能**：浏览器/PWA 推送通知

**场景**：
- 订单状态变更
- 支付审核结果
- 新优惠券

**状态**：🟡 可选

---

### 3. Sentry 错误监控

**功能**：生产环境错误追踪和报警

**状态**：🟡 可选

---

## 🔵 低优先级

### 4. WhatsApp Business API 集成

**功能**：完全自动化 WhatsApp 消息发送

**触发条件**：每日订单量 > 20 单

**实现方式**：
- 通过 Twilio WhatsApp 或 360dialog
- 需要申请 WhatsApp Business API 账号
- 每条消息约 RM 0.15

**状态**：🔵 未来考虑

---

### 5. E2E 自动化测试

**功能**：Playwright 端到端测试

**状态**：🔵 未来考虑

---

## ✅ 已完成

- [x] 全局错误边界
- [x] API Rate Limiting
- [x] 健康检查端点
- [x] localStorage 隐私模式兼容
- [x] ESLint 错误修复
- [x] 图片域名配置
