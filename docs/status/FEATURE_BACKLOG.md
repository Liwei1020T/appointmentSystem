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

### 2. 网站 WhatsApp 浮动按钮

**位置**：网站右下角（所有页面）

**功能描述**：
- 固定在页面右下角的绿色浮动按钮
- 点击后直接打开 WhatsApp 联系工作室
- 自带预设消息

**技术实现**：
```tsx
// WhatsApp 浮动按钮组件
const WHATSAPP_NUMBER = '60XXXXXXXXX'; // 工作室 WhatsApp 号码
const DEFAULT_MESSAGE = '你好，我想预约穿线服务';

const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
```

**按钮样式**：
- 固定位置：`fixed bottom-20 right-4`（避开底部导航）
- 尺寸：56x56px 圆形
- 颜色：WhatsApp 绿 (#25D366)
- 动画：轻微弹跳吸引注意

**显示规则**：
- ✅ 首页、预约页、评价页显示
- ❌ 管理后台不显示
- ❌ 登录/注册页不显示

**预计工时**：1 小时

**状态**：⏳ 待开发

---

### 3. WhatsApp Business 快捷回复模板

**用途**：在 WhatsApp Business App 中设置快捷回复

**模板列表**：

| 快捷键 | 场景 | 消息内容 |
|--------|------|----------|
| `/下单` | 引导下单 | "点击链接预约穿线 👇\nhttps://lwstringstudio.li-wei.net/booking" |
| `/价格` | 询价 | "穿线价格：\n• 普通线 RM25\n• 专业线 RM35-50\n\n详情：https://lwstringstudio.li-wei.net" |
| `/完成` | 穿线完成 | "您好！您的球拍已穿好，可以来取拍了 🏸" |
| `/收到` | 收到球拍 | "您好！已收到您的球拍，预计明天完成 ✅" |
| `/确认` | 收到付款 | "收到付款，谢谢！🙏" |
| `/取消` | 订单取消 | "您好，您的订单已取消，如有疑问请联系我们" |
| `/地址` | 店铺地址 | "📍 地址：[你的地址]\n🕐 营业时间：9:00-18:00\n📍 Google Maps：[链接]" |
| `/营业` | 营业时间 | "🕐 营业时间：\n周一至周六 9:00-18:00\n周日休息" |

**设置步骤**：
1. 打开 WhatsApp Business App
2. 设置 → 业务工具 → 快捷回复
3. 点击 "+" 添加上述模板

**状态**：⏳ 待配置（需要你在手机上操作）

---

## 🟡 中优先级

### 4. FCM 推送通知

**功能**：浏览器/PWA 推送通知

**场景**：
- 订单状态变更
- 支付审核结果
- 新优惠券

**状态**：🟡 可选

---

### 5. Sentry 错误监控

**功能**：生产环境错误追踪和报警

**状态**：🟡 可选

---

## 🔵 低优先级（订单量上来后考虑）

### 6. WhatsApp Bot 智能客服

**功能**：用户通过 WhatsApp 与 Bot 交互

**用户可以**：
| 发送 | Bot 返回 |
|------|----------|
| "我的订单" | 订单列表和状态 |
| "预约" | 引导填写预约信息 |
| "价格" | 价目表 |
| "进度" | 当前穿线进度 |
| "地址" | 店铺地址和营业时间 |

**触发条件**：日订单量 > 10 单（约 300单/月）

**技术实现**：
```
用户发 WhatsApp 消息
       ↓
WhatsApp Business API (Webhook)
       ↓
服务器接收 → Bot 逻辑处理 → 查询数据库
       ↓
返回结果给用户
```

**需要准备**：
- Meta Business 账号
- WhatsApp Business API 申请
- 验证的商业号码
- 服务器运行 Bot 逻辑

**成本估算**（300单/月）：
| 项目 | 月费 |
|------|------|
| WhatsApp API 消息费 | ~RM 50 |
| 服务器成本 | ~RM 20 |
| **总计** | **~RM 70/月** |

**开发时间**：3-5 天

**状态**：🔵 未来考虑（当前30单/月，手动更划算）

---

### 7. WhatsApp Business API 自动通知

**功能**：系统自动发送 WhatsApp 通知（无需手动）

**自动触发场景**：
- 穿线完成 → 自动发通知
- 支付审核通过 → 自动发通知
- 订单状态变更 → 自动发通知

**触发条件**：日订单量 > 20 单

**实现方式**：
- 通过 Twilio WhatsApp 或 Meta Cloud API
- 需要申请 WhatsApp Business API 账号
- 每条消息约 RM 0.10-0.15

**状态**：🔵 未来考虑

---

### 8. E2E 自动化测试

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
