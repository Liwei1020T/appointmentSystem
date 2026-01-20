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

### 6. WhatsApp Bot 智能客服（N8N 方案）

**功能**：用户通过 WhatsApp 与 Bot 交互

**用户可以**：
| 发送 | Bot 返回 |
|------|----------|
| "我的订单" / "订单" | 订单列表和状态 |
| "预约" / "下单" | 引导填写预约信息或发送链接 |
| "价格" | 价目表 |
| "进度" | 当前穿线进度 |
| "地址" / "营业时间" | 店铺地址和营业时间 |

**触发条件**：日订单量 > 10 单（约 300单/月）

---

#### ⚠️ 重要：必须使用 WhatsApp Business API

| 方式 | 自动发送 | 自动接收 | 合法性 |
|------|----------|----------|--------|
| WhatsApp Business App | ❌ 手动 | ❌ 手动 | ✅ |
| **WhatsApp Business API** | ✅ 自动 | ✅ 自动 | ✅ |
| 非官方破解 | ⚠️ | ⚠️ | ❌ 封号 |

**结论**：要实现 Bot 自动化，必须申请 WhatsApp Business API。

---

#### 🛠️ 推荐方案：N8N + WhatsApp API

**为什么用 N8N**：
- ✅ 开源免费（自托管）
- ✅ 可视化工作流，几乎不用写代码
- ✅ 开发时间从 3-5天 → **几小时**
- ✅ 可以连接现有 PostgreSQL 数据库
- ✅ 维护简单

**架构**：
```
用户发 WhatsApp 消息
       ↓
WhatsApp Business API
       ↓
N8N Webhook 接收
       ↓
N8N 工作流：
├── 解析用户意图（关键词匹配）
├── 查询 PostgreSQL 数据库
├── 生成回复内容
       ↓
N8N 调用 WhatsApp API 发送回复
```

---

#### 📋 实现步骤

**第一步：申请 WhatsApp Business API**
1. 注册 Meta Business 账号：https://business.facebook.com
2. 创建 WhatsApp Business 账号
3. 添加并验证手机号码
4. 获取 API Token

**第二步：部署 N8N**
```bash
# Docker 部署（可与现有服务器共用）
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

**第三步：创建 N8N 工作流**
1. 添加 WhatsApp Trigger 节点（接收消息）
2. 添加 Switch 节点（解析用户意图）
3. 添加 PostgreSQL 节点（查询数据库）
4. 添加 WhatsApp 节点（发送回复）

**第四步：设置 Webhook**
- 在 Meta Developer 后台配置 Webhook URL
- 指向 N8N 的 Webhook 地址

---

#### 💰 成本估算

| 项目 | 费用 |
|------|------|
| N8N（自托管） | ✅ 免费 |
| WhatsApp API（Meta Cloud） | ✅ 免费 |
| 消息费（300单/月×5条） | ~RM 50/月 |
| 服务器 | 可共用现有 |
| **总计** | **~RM 50/月** |

---

#### 📊 WhatsApp API 提供商对比

| 提供商 | 月费 | 消息费 | N8N 支持 | 推荐 |
|--------|------|--------|----------|------|
| **Meta Cloud API** | 免费 | ~RM 0.10/对话 | ✅ | ⭐ 推荐 |
| Twilio | 免费 | ~RM 0.15/条 | ✅ | 备选 |
| 360dialog | ~RM 50 | ~RM 0.08/对话 | ✅ | 量大时 |

---

**开发时间**：几小时（N8N 可视化配置）

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
