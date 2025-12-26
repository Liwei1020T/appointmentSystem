# 🏸 系统设计文档（System Design Document）

- 系统名称：String Service Platform  
- 版本：1.0  
- 角色：软件系统架构师 / 后端工程师 / 全栈工程师  

---

## 1. 系统概述（System Overview）

String Service Platform 是一个面向羽毛球穿线业务的全栈数字管理系统，包含：

- **用户端（Mobile Web App / Web App）**：预约、支付、积分、配套购买、订单追踪  
- **管理员后台（Admin Dashboard）**：库存管理、订单处理、营收分析、利润计算  
- **服务端（Supabase + Serverless Functions）**  
- **通知服务（SMS / Push Notification）**  

> Note (2025-12-26): The current Next.js implementation uses Prisma + NextAuth, and internal UI calls now go through App Router **Route Handlers** under `app/api/*`. Server Actions have been removed. External inbound endpoints (auth callbacks, payment webhooks, uploads) remain as API routes.

系统旨在实现穿线业务的：

- 自动化预约流程  
- 在线支付  
- 库存扣减  
- 利润核算  
- 用户成长机制（积分、优惠券、邀请）  
- 营运分析（Dashboard）  

---

## 2. 系统目标（System Goals）

| 目标               | 描述                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 自动化业务流程     | 降低人工记录工作，包括订单、库存、积分计算、利润结算               |
| 提升用户体验       | 让客户可在线购买、预约、查看进度、获取通知                         |
| 增强业务能力       | 配套销售、电商化营收、线上支付、活动营销                           |
| 数据化运营         | 统计营业额、利润、库存、订单高峰时段                               |
| 可扩展性           | 支撑未来扩展：AI 推荐、多分店、更多服务                            |

---

## 3. 系统架构（System Architecture）

### 3.1 架构模式（Architecture Style）

本系统采用 **SPA + Serverless + Cloud Backend（Supabase）** 架构：

- **User App（React）**  
- **Admin Dashboard（React）**  
- 通过 REST / RPC / Realtime 与后端交互  
- **Supabase**：Auth + DB + Storage + Realtime  
- **Supabase Functions**：业务逻辑层（Edge Functions / Serverless）  
- 外部服务（External Services）：
  - Payment Gateway（FPX / TNG / Stripe 等）  
  - SMS Provider  
  - Firebase Push（FCM）  

简化架构示意：

```text
User App (React SPA)
Admin Dashboard (React SPA)
        ↓  REST / RPC / Realtime
Supabase (Auth + PostgreSQL + Storage)
Supabase Edge Functions (Business Logic)
        ↓ External Integrations
Payment Gateway / SMS Provider / Firebase Push
```

架构特点：

- 使用 Supabase 作为认证 + 数据库 + 存储 + Realtime 通道。  
- 使用 Serverless Functions 替代传统后端（降低运维成本）。  
- 前端：React + Tailwind（用户端 & 后台端统一风格）。  
- 通过 Row Level Security (RLS) 保证数据隔离与安全访问。  

---

## 4. 系统模块设计（System Modules）

系统分为 8 个核心模块：

### 4.1 用户模块（User Module）

主要能力：

- 用户注册 / 登录（Email / Phone）  
- 用户个人资料管理  
- 邀请码管理（生成 / 绑定）  
- 积分记录（points_log）  
- 优惠券记录（user_vouchers）  
- 套餐购买与使用（user_packages）  
- 订单历史查看（orders）  

### 4.2 预约模块（Booking Module）

核心功能：

| 功能       | 描述                                                         |
| ---------- | ------------------------------------------------------------ |
| 创建预约   | 用户选择球线型号、拉力、时间、备注等                         |
| 更新状态   | 状态流转：`待处理 → 处理中 → 已完成`                        |
| 套餐抵扣   | 若用户有套餐，可在预约时抵扣一次支付流程                     |
| 自动扣库存 | 订单完成后，自动扣除对应球线库存                            |
| 自动发积分 | 用户完成订单后自动增加积分                                   |
| 自动计算利润 | 按公式 `利润 = 售价 - 成本价` 计算并记录                    |

### 4.3 支付模块（Payment Module）

使用外部支付服务（FPX / TNG / Stripe 等）：

主要功能：

- 创建支付订单（生成 payment record + 跳转支付）  
- 支付成功回调（Webhook）  
- 更新 Supabase 中的订单记录与支付状态  
- 处理套餐支付（支付成功后写入 user_packages）  
- 管理退款记录（可选，部分退款 / 全额退款）  

### 4.4 套餐模块（Package Module）

主要功能：

| 功能       | 描述                               |
| ---------- | ---------------------------------- |
| 套餐上架   | 管理员定义 5 次 / 10 次配套等      |
| 购买套餐   | 用户线上支付购买套餐               |
| 套餐使用   | 预约时自动抵扣一次，减少 remaining |
| 套餐到期提醒 | 接近到期 / 已到期推送通知          |

### 4.5 库存模块（Inventory Module）

适用于穿线师 / 管理员：

| 功能       | 描述                                 |
| ---------- | ------------------------------------ |
| 新增球线   | 记录型号、品牌、成本、售价          |
| 补货       | 增加库存数量并记录成本              |
| 扣库存     | 完成订单后自动扣减库存              |
| 库存阈值提醒 | 当库存 < 最低报警值时触发提醒      |

### 4.6 积分模块（Points Module）

自动处理以下场景：

- 订单完成 → 增加积分  
- 邀请成功（新用户使用邀请码注册） → 双方增加积分  
- 兑换优惠券 → 扣减积分  

积分可用于：

- 兑换折扣券（如 RM3 / RM5 / RM10）  
- 后续成长体系扩展（等级系统，例如 Silver / Gold / Pro）  

### 4.7 分析报表模块（Analytics Module）

管理员后台提供：

- 每日营业额  
- 每日利润  
- 套餐销售额统计  
- 用户增长曲线  
- 热门球线型号排行  
- 库存成本 & 销量分析  

### 4.8 通知模块（Notification Module）

支持多种通知方式：

- SMS：订单完成通知 / 重要状态提醒  
- Firebase Push（FCM）：  
  - 订单更新提醒  
  - 配套到期提醒  
  - 优惠券到期提醒  
  - 营销活动通知  
- 库存警告：库存低于阈值时通知管理员  

### 4.9 评价与反馈模块（Review & Feedback）

- 用户在订单完成后可提交评分、标签、文字及图片  
- 后台可查看用户评价并（可选）回复  
- 已实现 Next.js App Router 本地 API（Prisma + Postgres）持久化：`POST /api/reviews`、`GET /api/reviews/user`、`GET /api/reviews/order/:orderId`、`GET /api/reviews/featured`；未来接入 Supabase/Edge Functions 时需同步更新文档与接口适配  

---

## 5. 数据流设计（Data Flow Design）

### 5.1 用户预约 → 完成订单 → 扣库存 → 计算利润流程

1. 用户创建预约（User creates booking）。  
2. 前端调用 Supabase API，向 `orders` 表插入一条记录（INSERT）。  
3. 管理员在后台查看订单，将状态更新为 `"In Progress"`。  
4. 订单完成后，管理员将状态更新为 `"Completed"`。  
5. 触发 Supabase Function（或数据库触发器）执行：
   - 扣减对应球线库存（更新 `string_inventory.stock`）。  
   - 为用户增加积分（写入 `points_log` 并更新 `users.points`）。  
   - 根据售价和成本价计算利润，并写入 `orders.profit`。  
   - 发送 SMS 通知用户订单完成。  
6. 用户在前端看到订单完成状态和新积分（通知 + 订单列表）。  

### 5.2 套餐购买流程

1. 用户选择要购买的套餐（package）。  
2. 前端调用创建支付接口，跳转 Payment Gateway。  
3. 支付成功后，Payment Gateway 通过 Webhook 回调 Supabase Function：  
   - 校验支付签名与金额。  
   - 更新 `payments` 表记录为 `success`。  
   - 更新 `user_packages` 表：新增或累加 `remaining`。  
4. 用户在 App 中看到更新后的套餐剩余次数。  

### 5.3 邀请码使用流程

1. 新用户在注册时输入 referral code。  
2. Supabase：  
   - 将 inviter 与 invitee 建立关联（写入 `referral_log` 或 `users.referred_by`）。  
   - 分别为邀请人和被邀请人增加积分（写入 `points_log` 并更新 `users.points`）。  

---

## 6. 数据库设计（Database Schema）

采用 **PostgreSQL（Supabase）**，以下为核心表结构概述。

### 6.1 `users`

| 字段          | 类型   | 描述         |
| ------------- | ------ | ------------ |
| id            | uuid   | 主键         |
| email         | text   | 登录邮箱     |
| phone         | text   | 电话号码     |
| referral_code | text   | 专属邀请码   |
| referred_by   | text   | 上线的邀请码 |
| points        | int    | 当前积分     |

### 6.2 `orders`

| 字段       | 类型     | 描述                          |
| ---------- | -------- | ----------------------------- |
| id         | uuid     | 主键                          |
| user_id    | uuid     | 对应 `users.id`              |
| string_id  | uuid     | 对应 `string_inventory.id`   |
| tension    | int      | 拉力                          |
| price      | numeric  | 售价                          |
| cost       | numeric  | 成本                          |
| profit     | numeric  | 利润                          |
| status     | text     | 订单状态（pending / in_progress / completed 等） |
| use_package| boolean  | 是否使用套餐抵扣              |
| created_at | timestamp| 创建时间                      |

### 6.3 `packages`

| 字段          | 类型    | 描述         |
| ------------- | ------- | ------------ |
| id            | uuid    | 主键         |
| name          | text    | 套餐名称     |
| times         | int     | 包含次数     |
| price         | numeric | 套餐价格     |
| validity_days | int     | 有效天数     |
| active        | boolean | 是否上架     |

### 6.4 `user_packages`

| 字段       | 类型      | 描述                     |
| ---------- | --------- | ------------------------ |
| id         | uuid      | 主键                     |
| user_id    | uuid      | 用户 ID                  |
| package_id | uuid      | 套餐 ID                  |
| remaining  | int       | 剩余次数                 |
| expiry     | timestamp | 到期时间                 |

### 6.5 `string_inventory`

| 字段          | 类型    | 描述           |
| ------------- | ------- | -------------- |
| id            | uuid    | 主键           |
| model         | text    | 球线型号       |
| brand         | text    | 品牌           |
| cost_price    | numeric | 成本价         |
| selling_price | numeric | 售价           |
| stock         | int     | 当前库存       |
| minimum_stock | int     | 最低库存提醒值 |

### 6.6 `payments`

| 字段       | 类型     | 描述                        |
| ---------- | -------- | --------------------------- |
| id         | uuid     | 主键                        |
| order_id   | uuid     | 关联订单（如适用）         |
| amount     | numeric  | 支付金额                    |
| provider   | text     | 支付提供方（FPX / TNG / 等）|
| status     | text     | 支付状态（pending / success / failed / refunded 等） |
| created_at | timestamp| 创建时间                    |

### 6.7 其他表（vouchers / user_vouchers / points_log 等）

可扩展的表：

- `vouchers`：定义优惠券类型、面值、有效期、条件。  
- `user_vouchers`：用户拥有的优惠券、状态（未使用 / 已使用 / 已过期）。  
- `points_log`：记录积分变动来源：订单、邀请、兑换等。  
- `referral_log`：记录邀请关系及时间（可选）。  

---

## 7. API / Function 设计（Supabase Edge Functions）

以下为核心业务 Function 示例。

### 7.1 完成订单触发自动逻辑

`POST /complete-order`

**Input：**

```json
{
  "order_id": "xxx"
}
```

**Actions：**

- 校验调用者权限（仅管理员或安全通道）。  
- 更新订单状态为 `completed`。  
- 扣减 `string_inventory` 中对应球线库存。  
- 计算利润并更新 `orders.profit`。  
- 增加用户积分，写入 `points_log`。  
- 发送 SMS / Push 通知用户订单完成。  
- 更新用户购买历史（如需）。  

### 7.2 创建支付订单

`POST /create-payment`

功能：

- 接收订单信息（或套餐购买信息）。  
- 在 `payments` 表创建记录，状态为 `pending`。  
- 生成支付链接 / session，返回给前端。  

### 7.3 支付回调

`POST /payment-webhook`

功能：

- 接收 Payment Gateway 回调。  
- 校验签名（Webhook Secret）。  
- 更新 `payments.status`。  
- 若为订单支付：
  - 更新对应 `orders` 的支付状态字段。  
- 若为套餐购买：
  - 更新 `user_packages` 剩余次数。  

### 7.4 创建套餐购买

`POST /buy-package`

功能：

- 前端调用，创建一条待支付的套餐购买记录。  
- 调用 `create-payment` 生成支付链接。  
- 支付完成后由 `payment-webhook` 更新 `user_packages`。  

---

## 8. 安全设计（Security Design）

### 8.1 Row Level Security（RLS）

通过 Supabase RLS 限制数据访问范围：

| 用户角色 | 权限说明                                   |
| -------- | ------------------------------------------ |
| User     | 只能访问自己的订单、积分、套餐等数据       |
| Admin    | 可访问所有订单、库存、报表等管理数据       |

RLS 策略示例（概念）：

- `orders`：`user_id = auth.uid()`（User 角色）。  
- `user_packages`：`user_id = auth.uid()`。  
- `string_inventory`：仅 Admin 角色可 `select / insert / update`。  

### 8.2 常见安全措施

- 使用 JWT 认证（Supabase Auth）。  
- 全站 HTTPS Only。  
- 严格配置 Supabase Policies。  
- Payment Gateway Webhook 使用签名校验（Webhook Secret）。  
- 防止重复支付：使用 idempotency key / 唯一业务 ID。  
- 防止恶意扣库存：所有库存扣减逻辑只在 Edge Function 中执行，不在前端直接操作。  

---

## 9. 性能设计（Performance Considerations）

- 为高频查询字段加索引：
  - `orders.user_id`  
  - `orders.created_at`  
  - `payments.order_id`  
- 使用 Supabase Realtime 推送订单更新与状态变动。  
- Serverless / Edge Functions 支持自动扩容，应对高峰期。  
- 静态资源（前端构建结果）使用 Vercel / Netlify CDN 加速。  
- 尽量减少 N+1 查询，使用合适的视图或聚合查询用于报表。  

---

## 10. 系统部署（Deployment Strategy）

| 模块                  | 部署位置                           |
| --------------------- | ---------------------------------- |
| 前端 React App        | Vercel / Netlify（推荐 Next.js）  |
| Supabase（DB + Auth） | Supabase Cloud                     |
| Edge Functions        | Supabase Functions                 |
| 图片 / 球线照片       | Supabase Storage                   |
| Firebase Notification | Firebase Cloud Messaging（FCM）    |

---

## 11. 可扩展性（Scalability）

未来可扩展方向：

- 多分店穿线师系统（支持多个门店、管理员角色）。  
- AI 自动推荐球线（基于用户历史订单与水平）。  
- 球拍检测记录（维护球拍档案，记录使用历史）。  
- 会员等级系统（Silver / Gold / Pro 等等级权益）。  
- B2B 球馆合作接口（为球馆提供 API 接入）。  

---

## 12. 系统流程（High-Level System Flow）

### 12.1 用户流程

1. 打开 App  
2. 预约穿线  
3. 付款 / 套餐抵扣  
4. 等待处理（处理中状态）  
5. 订单完成通知（SMS / Push）  
6. 积分到账  
7. 用户再次回流购买 / 预约  

### 12.2 管理员流程

1. 登录 Admin Dashboard  
2. 查看订单列表  
3. 处理进度（更新状态：待处理 → 处理中 → 已完成）  
4. 完成订单：自动扣库存、计算利润、发积分  
5. 查看报表（营业额、利润、库存、套餐销售等）  
6. 管理库存 / 套餐 / 优惠券与活动配置  

---

## 📌 总结（Summary）

本系统设计文档涵盖：

- 整体架构（前端 / 后端 / 外部服务）。  
- 核心业务模块（预约、支付、套餐、库存、积分、报表、通知）。  
- 数据流设计（订单、套餐、邀请码）。  
- 数据库结构（核心表及扩展表）。  
- API / Edge Function 设计。  
- 安全设计与 RLS 策略思路。  
- 性能与部署策略。  
- 可扩展性与未来规划。  

该文档可作为 String Service Platform 的系统级 Blueprint，用于指导后续详细设计与实现。  
