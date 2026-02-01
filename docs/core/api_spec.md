# 🔌 API Specification

**String Service Platform — API Reference**
**Version:** 2.1
**Last Updated:** 2026-01-29
**Backend:** Next.js Route Handlers (Prisma + PostgreSQL)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User APIs](#user-apis)
4. [Order APIs](#order-apis)
5. [Payment APIs](#payment-apis)
6. [Package APIs](#package-apis)
7. [Inventory APIs](#inventory-apis)
8. [Points & Vouchers APIs](#points--vouchers-apis)
9. [Admin APIs](#admin-apis)
10. [Notification APIs](#notification-apis)
11. [Analytics APIs](#analytics-apis)
12. [Error Handling](#error-handling)

---

## Overview

**Note (2025-12-28):** All internal APIs have been standardized to use `camelCase` for request payloads and response objects. Legacy `snake_case` fields have been removed.

### Base URL

```
Local API: http://localhost:3000/api
Production API: https://your-domain.com/api
```

### Authentication

All authenticated endpoints require:
- Cookie-based session managed by NextAuth.js v5.
- For internal Route Handlers, authentication is checked server-side via `requireAuth()` helper.

### Response Format

**Standard Success Response:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Standard Error Response:**
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { }
  }
}
```

---

## Authentication

> Note: The platform now supports **Phone + Password** and **OTP-based** authentication via NextAuth.js.

### Phone + Password (Next.js)

#### 1) Sign Up (Phone + Password)

**Endpoint:** `POST /api/auth/signup`  
**Auth Required:** No

**Request Body:**
```json
{
  "fullName": "Test User",
  "phone": "01131609008",
  "password": "Password123",
  "referralCode": "ABCD1234"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Test User",
      "phone": "601131609008",
      "referralCode": "XXXX",
      "points": 0
    }
  }
}
```

---

## User APIs

### 1. Update Profile

**Endpoint:** `PATCH /api/profile`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "phone": "+60198765432",
  "address": "No. 8, Jalan SS2/67, Petaling Jaya",
  "avatarUrl": "https://cdn.example.com/avatars/user.png"
}
```

**Response:** `{ "ok": true, "data": { ... } }`

---

## Order APIs

### 2. Create Order (Single Racket)

**Endpoint:** `POST /api/orders`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "stringId": "uuid",
  "tension": 26,
  "finalPrice": 35.00,
  "usePackage": false,
  "voucherId": null,
  "notes": "Please string by tomorrow"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "pending",
    "price": 35.00,
    "createdAt": "2025-12-28T10:00:00Z"
  }
}
```

### 3. Create Order (Multi-Racket)

**Endpoint:** `POST /api/orders`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "items": [
    {
      "stringId": "uuid-1",
      "tensionVertical": 26,
      "tensionHorizontal": 24,
      "racketPhoto": "https://...",
      "notes": "Racket 1 notes"
    },
    {
      "stringId": "uuid-2",
      "tensionVertical": 28,
      "tensionHorizontal": 26,
      "racketPhoto": "https://...",
      "notes": "Racket 2 notes"
    }
  ],
  "usePackage": false,
  "notes": "Multi-racket order"
}
```

---

### 4. Get User Orders

**Endpoint:** `GET /api/orders`  
**Auth Required:** Yes

**Query Parameters:**
- `status` (optional): pending, in_progress, completed, cancelled
- `limit` (optional): number
- `page` (optional): number

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "status": "completed",
      "finalPrice": 28.00,
      "createdAt": "2025-12-28T10:00:00Z",
      "string": {
        "brand": "YONEX",
        "model": "BG66UM"
      }
    }
  ]
}
```

---

### 8. Update Order Status (Admin)

**Endpoint:** `POST /functions/v1/update-order-status`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "order_id": "uuid",
  "status": "in_progress"  // or "completed"
}
```

**Business Logic (when status = 'completed'):**
- Deduct inventory (`string_inventory.stock - 1`)
- Log stock change in `stock_logs`
- Calculate and save profit (`price - cost_price`)
- Award points to user
- Create notification for user
- Optionally send SMS

**Response:**
```json
{
  "success": true,
  "data": {
    "order": { updated order object },
    "inventory_updated": true,
    "points_awarded": 10
  }
}
```

---

### 9. Get Order Details

**Endpoint:** `GET /api/orders/{id}`  
**Auth Required:** Yes

**Description:** Returns the requested order joined with string details, payment history, applied voucher, and any `user_packages` record used for this booking.

**Key Fields:**
- `use_package`: `true` when the order was covered by a package redemption.
- `packageUsed`: Includes `remaining`, `expiry`, and nested `package` metadata for UI showing the package name and counts.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "string_id": "uuid",
    "tension": 26,
    "price": 0.00,
    "status": "completed",
    "use_package": true,
    "final_price": 0.00,
    "packageUsed": {
      "id": "user-package-uuid",
      "remaining": 4,
      "expiry": "2026-01-10T00:00:00Z",
      "package": {
        "id": "package-uuid",
        "name": "10次高端穿线配套",
        "times": 10
      }
    },
    "string": {
      "brand": "YONEX",
      "model": "BG66UM"
    },
    "payments": []
  }
}
```

---

## Payment APIs

### 10. Create Payment

**Endpoint:** `POST /functions/v1/create-payment`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "type": "order",  // or "package"
  "reference_id": "uuid",  // order_id or package_id
  "amount": 28.00,
  "provider": "fpx"  // "fpx", "tng", "stripe", "card"
}
```

**Business Logic:**
- Creates payment record with status `pending`
- Calls payment gateway API to generate payment session
- Returns payment URL for redirect

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_url": "https://gateway.com/pay/session_xxx",
    "transaction_id": "TXN_123456"
  }
}
```

---

### 11. Payment Webhook

**Endpoint:** `POST /functions/v1/payment-webhook`  
**Auth Required:** No (Signature verification required)

**Request Body:** (Provider-specific format)

**Business Logic:**
- Verifies webhook signature
- Updates payment status
- If payment successful:
  - For order payment: Update order payment status
  - For package payment: Create/update `user_packages` record
  - Create notification
  - Optionally send SMS

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

### 12. Get Payment History

**Endpoint:** `GET /rest/v1/payments?user_id=eq.{user_id}&order=created_at.desc`  
**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "amount": 28.00,
    "provider": "fpx",
    "status": "success",
    "transaction_id": "TXN_123456",
    "created_at": "2025-12-11T10:00:00Z"
  }
]
```

---

## Package APIs

### 12. Get Available Packages

**Endpoint:** `GET /rest/v1/packages?active=eq.true`  
**Auth Required:** No

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "5次穿线配套",
    "description": "5次穿线服务，有效期6个月",
    "times": 5,
    "price": 120.00,
    "original_price": 140.00,
    "validity_days": 180,
    "image_url": "https://..."
  }
]
```

---

### 13. Purchase Package

**Endpoint:** `POST /functions/v1/purchase-package`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "package_id": "uuid"
}
```

**Business Logic:**
- Validates package availability
- Creates payment record
- Returns payment URL
- On payment success (via webhook):
  - Creates `user_packages` record
  - Sets expiry date based on `validity_days`

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_url": "https://gateway.com/pay/xxx"
  }
}
```

---

### 14. Get User Packages

**Endpoint:** `GET /rest/v1/user_packages?user_id=eq.{user_id}&status=eq.active`  
**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "package": {
      "name": "5次穿线配套",
      "times": 5
    },
    "remaining": 3,
    "expiry": "2026-06-11T00:00:00Z",
    "status": "active",
    "created_at": "2025-12-11T10:00:00Z"
  }
]
```

---

## Inventory APIs

### 15. Get String Inventory (Public)

**Endpoint:** `GET /rest/v1/string_inventory?active=eq.true&select=id,brand,model,selling_price,color,gauge,image_url`  
**Auth Required:** No

**Response:**
```json
[
  {
    "id": "uuid",
    "brand": "YONEX",
    "model": "BG66UM",
    "selling_price": 28.00,
    "color": "White",
    "gauge": "0.65mm",
    "image_url": "https://..."
  }
]
```

---

### 16. Get String Inventory (Admin - Full Details)

**Endpoint:** `GET /rest/v1/string_inventory`  
**Auth Required:** Yes (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "brand": "YONEX",
    "model": "BG66UM",
    "cost_price": 18.00,
    "selling_price": 28.00,
    "stock": 25,
    "minimum_stock": 5,
    "active": true,
    "created_at": "2025-12-11T10:00:00Z"
  }
]
```

---

### 17. Add String to Inventory (Admin)

**Endpoint:** `POST /rest/v1/string_inventory`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "brand": "YONEX",
  "model": "BG66UM",
  "cost_price": 18.00,
  "selling_price": 28.00,
  "stock": 50,
  "minimum_stock": 5,
  "color": "White",
  "gauge": "0.65mm",
  "image_url": "https://...",
  "active": true
}
```

**Response:** Created inventory object

---

### 18. Restock Inventory (Admin)

**Endpoint:** `POST /functions/v1/restock-inventory`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "string_id": "uuid",
  "quantity": 20,
  "cost_price": 18.00,
  "notes": "Bulk purchase from supplier"
}
```

**Business Logic:**
- Updates `string_inventory.stock`
- Creates `stock_logs` record with type `restock`

**Response:**
```json
{
  "success": true,
  "data": {
    "string_id": "uuid",
    "new_stock": 45,
    "stock_log_id": "uuid"
  }
}
```

---

### 19. Get Stock Logs (Admin)

**Endpoint:** `GET /rest/v1/stock_logs?string_id=eq.{string_id}&order=created_at.desc`  
**Auth Required:** Yes (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "change": 20,
    "type": "restock",
    "cost_price": 18.00,
    "notes": "Bulk purchase",
    "created_at": "2025-12-11T10:00:00Z"
  },
  {
    "id": "uuid",
    "change": -1,
    "type": "sale",
    "reference_id": "order_uuid",
    "created_at": "2025-12-11T11:00:00Z"
  }
]
```

---

## Points & Vouchers APIs

### 20. Redeem Voucher with Points

**Endpoint:** `POST /functions/v1/redeem-voucher`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "voucher_id": "uuid"
}
```

**Business Logic:**
- Validates user has enough points
- Deducts points from user
- Creates `user_vouchers` record with status `active`
- Creates `points_log` record with type `redeem`

**Response:**
```json
{
  "success": true,
  "data": {
    "user_voucher_id": "uuid",
    "points_deducted": 50,
    "remaining_points": 100
  }
}
```

---

### 21. Get Available Vouchers

**Endpoint:** `GET /rest/v1/vouchers?active=eq.true&valid_from=lte.now()&valid_until=gte.now()`  
**Auth Required:** No

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "SAVE5",
    "name": "RM5 Discount",
    "type": "fixed_amount",
    "value": 5.00,
    "min_purchase": 20.00,
    "points_cost": 50,
    "valid_until": "2026-01-11T00:00:00Z"
  }
]
```

---

### 22. Get User Vouchers

**Endpoint:** `GET /rest/v1/user_vouchers?user_id=eq.{user_id}&status=eq.active`  
**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "voucher": {
      "code": "SAVE5",
      "name": "RM5 Discount",
      "value": 5.00,
      "min_purchase": 20.00
    },
    "status": "active",
    "expiry": "2026-01-11T00:00:00Z",
    "created_at": "2025-12-11T10:00:00Z"
  }
]
```

---

### Local Placeholder Endpoints (Next.js App Router)

> 说明：该区块用于记录“为了避免 404/HTML 响应导致前端崩溃”的占位接口。当前已全部移除/实现，无剩余占位端点。

### Local Implemented Endpoints (Next.js App Router)

- `GET /api/profile` → 当前用户资料 + 统计（需登录）。  
- `PATCH /api/profile` → 更新用户资料（需登录）。  
- `POST /api/profile/password` → 修改登录密码（需登录）。  
- `POST /api/profile/referral-code` → 获取/生成推荐码（需登录）。  
- `GET /api/referrals` → 推荐记录 + 统计（需登录）。  
- `GET /api/referrals/my-stats` → 推荐统计（需登录）。  
- `GET /api/referrals/leaderboard` → 推荐排行榜（需登录）。  
- `GET /api/points` → 积分余额 + 明细（需登录）。  
- `GET /api/points/history` → 积分明细（支持 type/limit，需登录）。  
- `GET /api/points/stats` → 积分统计（需登录）。  
- `POST /api/points/redeem` → 积分扣减（需登录）。  
- `GET /api/vouchers/user` → 用户优惠券列表（支持 `status/mapped`，需登录）。  
- `POST /api/vouchers/redeem` → 通过 code 领取优惠券（需登录）。  
- `GET /api/user/vouchers` → Prisma `user_vouchers` + `vouchers` 联表，返回 `{ vouchers: [...] }`（需登录，legacy）。  
- `GET /api/vouchers/redeemable` → Prisma `vouchers` 表筛选 active + valid window，返回 `{ vouchers: [...] }`（需登录）。  
- `POST /api/vouchers/redeem-with-points` → 使用积分兑换指定 `voucherId`，写入 `user_vouchers` 与 `points_log`（需登录）。  
- `GET /api/vouchers/stats` → 当前用户优惠券统计（total/active/used/expired/usageRate，需登录）。  
- `GET /api/notifications` → 通知列表 + 未读数（需登录）。  
- `POST /api/notifications` → 标记已读（单条/全部，需登录）。  
- `DELETE /api/notifications/:id` → 删除通知（需登录）。  
- `POST /api/reviews` → 提交评价（需登录）。  
- `GET /api/reviews/user` → 当前用户评价（需登录）。  
- `GET /api/reviews/order/:orderId` → 订单评价（订单 owner/管理员）。  
- `GET /api/reviews/pending` → 待评价订单（需登录）。  
- `GET /api/reviews/featured` → 精选评价（公开）。  
- `GET /api/admin/reviews` → 管理端评价列表（管理员）。  
- `GET /api/admin/reviews/stats` → 管理端评价统计（管理员）。  
- `POST /api/admin/reviews/:id/reply` → 管理端回复评价（管理员）。  
- `GET /api/admin/stats` → 管理端统计（管理员）。  
- `GET /api/admin/dashboard-stats` → 管理端首页统计（管理员）。  
- `GET /api/admin/orders` → 管理端订单列表（支持 status/q/page/limit，管理员）。  
- `GET /api/admin/orders/:id` → 管理端订单详情（管理员）。  
- `PATCH /api/admin/orders/:id/status` → 管理端更新订单状态（可选 `notes` 写入状态备注，管理员）。  
- `GET /api/admin/orders/stats` → 管理端订单统计（支持时间筛选，管理员）。  
- `GET /api/admin/promotions` → 营销活动列表 + 使用汇总（管理员）。  
- `POST /api/admin/promotions` → 创建营销活动（管理员）。  
- `GET /api/admin/analytics` → 业务洞察（LTV/留存/客单价趋势/热门时段，管理员）。  
- `GET /api/admin/vouchers` → 管理端优惠券列表（管理员）。  
- `POST /api/admin/vouchers` → 创建优惠券（支持 `isAutoIssue/isFirstOrderOnly/validityDays`，管理员）。  
- `PATCH /api/admin/vouchers` → 更新优惠券（支持 `isAutoIssue/isFirstOrderOnly/validityDays`，管理员）。  
- `DELETE /api/admin/vouchers` → 删除优惠券（管理员）。  
- `GET /api/admin/vouchers/stats` → 管理端优惠券统计（管理员）。  
- `GET /api/admin/vouchers/user/:userId` → 管理端查看指定用户的优惠券列表（管理员）。  
- `POST /api/admin/vouchers/:id/distribute` → 管理端分发优惠券（支持 all/specific；返回 `{ count, distributed, skipped }`，管理员）。  
- `POST /api/packages/buy` → 创建“套餐支付单”（Prisma `payments`），`provider=tng|cash`、`status=pending`；TNG 上传收据后变更为 `pending_verification`；管理员确认后创建 `user_packages`（需登录）。  
- `GET /api/admin/packages` → 套餐列表（支持 status/search/includeInactive，管理员）。  
- `POST /api/admin/packages` → 创建套餐（兼容 `validityDays/validity_days`，管理员）。  
- `PATCH /api/admin/packages` → 更新套餐（兼容 `validityDays/validity_days`，管理员）。  
- `GET /api/admin/packages/:id` → 获取套餐详情（管理员）。  
- `PUT /api/admin/packages/:id` → 更新套餐（管理员）。  
- `DELETE /api/admin/packages/:id` → 删除套餐（管理员；存在购买记录则返回 409）。  
- `PATCH /api/admin/packages/:id/status` → 上下架套餐（管理员）。  
- `GET /api/admin/packages/purchases` → 套餐购买记录（支持 packageId/userId/date/page/limit，管理员）。  
- `GET /api/admin/packages/stats` → 套餐统计（总购买数/收入/本月数据/最受欢迎，管理员）。  
- `GET /api/admin/packages/sales` → 套餐销量聚合（按套餐统计销量、收入、活跃用户，管理员）。  
- `GET /api/orders` → 当前用户订单列表（支持 status/limit/page，需登录）。  
- `POST /api/orders` → 创建订单（支持单球拍/多球拍 payload，需登录）。  
- `POST /api/orders/create` → legacy 套餐/优惠券创建接口（需登录）。  
- `GET /api/orders/:id` → 订单详情（订单 owner，需登录）。  
- `POST /api/orders/:id/cancel` → 取消待处理订单（订单 owner，需登录）。  
- `POST /api/orders/:id/complete` → 完成订单（管理员）。  
- `GET /api/orders/:id/photos` → 订单照片列表（订单 owner 或管理员）。  
- `POST /api/orders/:id/photos` → 上传订单照片（管理员）。  
- `DELETE /api/orders/:id/photos/:photoId` → 删除订单照片（管理员）。  
- `POST /api/orders/:id/photos/reorder` → 重排订单照片（管理员）。  
- `GET /api/payments/:id` → 获取支付详情（需要登录；订单 owner 或管理员）。  
- `POST /api/payments` → 创建支付记录（订单/套餐，二选一：`orderId` 或 `packageId`；默认 `paymentMethod=tng`）。  
- `POST /api/payments/cash` → 创建现金支付记录（需要登录）。  
- `POST /api/payments/:id/receipt` → 更新 `receiptUrl` 并进入 `pending_verification`（需要登录，仅本人）。  
- `POST /api/payments/:id/proof` → 上传支付凭证（multipart）并进入 `pending_verification`（需要登录，仅本人）。  
- `GET /api/admin/payments/pending` → 待审核支付列表（TNG：`pending_verification`；现金：`pending|pending_verification`，管理员）。  
- `POST /api/payments/:id/verify` → 管理员确认支付（支持现金与非现金；置 `success` 并按需创建 `user_packages`）。  
- `POST /api/payments/:id/reject` → 管理员拒绝支付并记录原因（置 `rejected`）。  
- `GET /api/admin/reports` → 报表概览（revenue/orders/customers，管理员）。  
- `GET /api/admin/reports/revenue` → 收入趋势与分类（管理员）。  
- `GET /api/admin/reports/profit` → 利润分析 + Profit by Product（管理员）。  
- `GET /api/admin/reports/sales` → 销售统计（完成率/使用率/状态分布/按天趋势，管理员）。  
- `GET /api/admin/reports/top-strings` → 热门球线（管理员）。  
- `GET /api/admin/reports/top-packages` → 热门套餐（管理员）。  
- `GET /api/admin/reports/user-growth` → 用户增长（管理员）。  
- `GET /api/admin/reports/order-trends` → 订单趋势（按小时/周几/月，管理员）。  
- `GET /api/admin/reports/export` → CSV 导出（管理员）。  
- `GET /api/admin/stats` → 管理员仪表板快捷指标（today/month orders & revenue、low-stock count、pending orders、active packages，管理员）。
- `GET /api/admin/users` → 用户列表（支持 search/role/page/limit，管理员）。
- `GET /api/admin/users/:id` → 用户详情（管理员）。
- `PATCH /api/admin/users/:id` → 更新用户信息（管理员）。
- `POST /api/admin/users/:id/block` → 封禁/解封用户（管理员）。
- `GET /api/admin/users/:id/orders` → 用户订单列表（管理员）。
- `GET /api/admin/users/:id/packages` → 用户套餐列表（管理员）。
- `POST /api/admin/users/:id/points` → 调整用户积分（管理员）。
- `GET /api/admin/users/:id/points-log` → 用户积分明细（管理员）。
- `POST /api/admin/users/:id/role` → 修改用户角色（管理员）。
- `GET /api/admin/users/stats` → 用户统计（总数/活跃/新增趋势，管理员）。
- `GET /api/admin/inventory` → 库存列表（支持 search/active/lowStock，管理员）。
- `GET /api/admin/inventory/:id` → 库存详情（管理员）。
- `POST /api/admin/inventory` → 添加库存项（管理员）。
- `PATCH /api/admin/inventory/:id` → 更新库存项（管理员）。
- `DELETE /api/admin/inventory/:id` → 删除库存项（管理员）。
- `POST /api/admin/inventory/:id/stock` → 调整库存数量（管理员）。
- `GET /api/admin/inventory/:id/logs` → 库存变更日志（管理员）。
- `GET /api/admin/inventory/logs` → 全部库存日志（管理员）。
- `POST /api/admin/inventory/restock` → 批量补货（管理员）。
- `PATCH /api/admin/orders/:id` → 更新订单信息（管理员）。
- `POST /api/admin/orders/:id/eta` → 设置订单预计完成时间（管理员）。
- `POST /api/admin/reviews/:id/featured` → 切换精选状态（管理员）。
- `GET /api/admin/vouchers/:id/users` → 持有指定优惠券的用户列表（管理员）。
- `POST /api/admin/cron/order-automation` → 订单自动化任务（取消超时订单，管理员/Cron）。
- `POST /api/admin/cron/package-renewal` → 套餐续期提醒任务（管理员/Cron）。
- `POST /api/cron/cleanup-orders` → 清理过期订单草稿（Cron）。
- `POST /api/reviews` → 提交订单评价（需要登录；仅允许评价自己的 completed 订单；奖励 10 积分并写入 `points_log`）。  
- `GET /api/reviews/user` → 当前用户评价列表（需要登录；返回 `{ reviews: [...] }`）。  
- `GET /api/reviews/order/:orderId` → 获取订单评价（需要登录；订单 owner 或管理员；返回 `{ review: ... | null }`）。  
- `GET /api/reviews/featured` → 精选评价（公开；返回 array，用于首页轮播）。
- `GET /api/reviews` → 公开评价列表（支持 limit/offset，公开）。
- `POST /api/reviews/:id/like` → 点赞评价（需登录）。
- `GET /api/health` → 健康检查（返回服务状态，公开）。
- `POST /api/upload` → 通用文件上传（multipart，需登录）。
- `GET /api/stats` → 公开统计（总订单数/用户数/评价数，公开）。
- `GET /api/user/stats` → 当前用户统计（需登录）。
- `GET /api/profile/badges` → 用户徽章列表（需登录）。
- `GET /api/profile/membership` → 会员信息（等级/进度/权益，需登录）。
- `POST /api/auth/otp/request` → 请求 OTP 验证码（密码重置，公开）。
- `POST /api/auth/password-reset/confirm` → 确认密码重置（公开）。
- `GET /api/packages/featured` → 精选套餐（公开）。
- `GET /api/packages/pending-payments` → 待支付套餐列表（需登录）。
- `GET /api/packages/user/:id/usage` → 指定用户套餐使用记录（管理员）。
- `POST /api/payments/tng/callback` → TNG 支付回调（签名验证）。
- `GET /api/reviews/public` → 公开评价列表（公开）。
- `GET /api/reviews/public/:id` → 公开评价详情（公开）。

---

## Admin APIs

### 23. Get All Orders (Admin)

**Endpoint:** `GET /rest/v1/orders?order=created_at.desc`  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `status=eq.pending`
- `limit=50&offset=0`

**Response:** Array of order objects with user details

---

### 24. Get Dashboard Statistics (Admin)

**Endpoint:** `POST /functions/v1/admin-dashboard-stats`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "period": "today"  // "today", "week", "month", "year"
}
```

**Business Logic:**
- Calculates revenue, profit, order count
- Groups by time period

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "orders": 560.00,
      "packages": 240.00,
      "total": 800.00
    },
    "profit": 320.00,
    "order_count": 20,
    "package_sales": 2,
    "new_users": 5,
    "low_stock_items": [
      {
        "brand": "YONEX",
        "model": "BG66UM",
        "stock": 3
      }
    ]
  }
}
```

---

### 25. Get Revenue Report (Admin)

**Endpoint:** `POST /functions/v1/admin-revenue-report`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "group_by": "day"  // "day", "week", "month"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 15600.00,
      "total_profit": 6200.00,
      "order_count": 120
    },
    "breakdown": [
      {
        "date": "2025-12-01",
        "revenue": 280.00,
        "profit": 120.00,
        "order_count": 5
      }
    ]
  }
}
```

---

### 26. Manage Users (Admin)

**Endpoint:** `GET /rest/v1/users?order=created_at.desc`  
**Auth Required:** Yes (Admin only)

**Endpoint:** `PATCH /rest/v1/users?id=eq.{user_id}`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "points": 200,  // Update points
  "role": "admin"  // Change role
}
```

---

### Admin Order Status Update (Route Handler)

**Endpoint:** `PATCH /api/admin/orders/{id}/status`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "预计今晚完成"
}
```

**Response:**
```json
{
  "ok": true,
  "data": { "id": "order-id", "status": "in_progress" }
}
```

**Notes:**
- `notes` 会记录到 `order_status_logs` 作为状态备注。

---

### Admin Promotions (Route Handler)

**Endpoint:** `GET /api/admin/promotions`  
**Auth Required:** Yes (Admin only)

**Response:**
```json
{
  "ok": true,
  "data": {
    "promotions": [
      {
        "id": "promo-id",
        "name": "新年限时折扣",
        "type": "FLASH_SALE",
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "usageCount": 12
      }
    ],
    "usageSummary": {
      "totalSavedAmount": 120.5,
      "totalUsageCount": 24
    }
  }
}
```

**Endpoint:** `POST /api/admin/promotions`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "name": "满 RM50 减 RM5",
  "type": "SPEND_SAVE",
  "discountType": "FIXED",
  "discountValue": 5,
  "minPurchase": 50,
  "startAt": "2026-01-01T00:00:00.000Z",
  "endAt": "2026-01-31T23:59:59.000Z",
  "usageLimit": 100
}
```

---

### Admin Announcements (Route Handler)

**Endpoint:** `GET /api/admin/announcements`
**Auth Required:** Yes (Admin only)

**Response:**
```json
{
  "ok": true,
  "data": {
    "announcements": [
      {
        "id": "announcement-id",
        "title": "春节营业时间调整",
        "content": "春节期间营业时间...",
        "imageUrl": null,
        "linkUrl": null,
        "linkText": null,
        "priority": 0,
        "startAt": "2026-01-25T00:00:00Z",
        "endAt": "2026-02-10T23:59:59Z",
        "isActive": true,
        "createdAt": "2026-01-20T10:00:00Z"
      }
    ],
    "summary": {
      "activeCount": 2,
      "endedCount": 5,
      "totalCount": 7
    }
  }
}
```

**Endpoint:** `POST /api/admin/announcements`
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "title": "春节营业时间调整",
  "content": "春节期间营业时间为...",
  "imageUrl": "https://...",
  "linkUrl": "https://...",
  "linkText": "了解更多",
  "priority": 10,
  "startAt": "2026-01-25T00:00:00.000Z",
  "endAt": "2026-02-10T23:59:59.000Z"
}
```

**Endpoint:** `PATCH /api/admin/announcements/{id}`
**Auth Required:** Yes (Admin only)

**Request Body:** (all fields optional)
```json
{
  "title": "更新标题",
  "content": "更新内容",
  "isActive": false
}
```

**Endpoint:** `DELETE /api/admin/announcements/{id}`
**Auth Required:** Yes (Admin only)

---

### User Events (Route Handler)

**Endpoint:** `GET /api/events/active`
**Auth Required:** No

获取当前生效的促销活动和公告。

**Response:**
```json
{
  "ok": true,
  "data": {
    "promotions": [
      {
        "id": "promo-id",
        "name": "新年限时折扣",
        "type": "FLASH_SALE",
        "discountType": "PERCENTAGE",
        "discountValue": "10",
        "minPurchase": null,
        "startAt": "2026-01-01T00:00:00Z",
        "endAt": "2026-01-31T23:59:59Z"
      }
    ],
    "announcements": [
      {
        "id": "announcement-id",
        "title": "春节营业时间",
        "content": "...",
        "imageUrl": null,
        "linkUrl": null,
        "linkText": null,
        "startAt": "2026-01-25T00:00:00Z",
        "endAt": "2026-02-10T23:59:59Z"
      }
    ]
  }
}
```

**Endpoint:** `GET /api/events/history`
**Auth Required:** No

获取已结束的活动归档，支持分页。

**Query Parameters:**
- `page` - 页码，默认 1
- `limit` - 每页数量，默认 10

**Response:**
```json
{
  "ok": true,
  "data": {
    "promotions": [...],
    "announcements": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "promotionsTotal": 5,
      "announcementsTotal": 3
    }
  }
}
```

---

### Admin Analytics (Route Handler)

**Endpoint:** `GET /api/admin/analytics`  
**Auth Required:** Yes (Admin only)

**Response:**
```json
{
  "ok": true,
  "data": {
    "ltv": { "ltv": 20, "totalSales": 2000, "totalUsers": 100 },
    "retention": { "retentionRate": 40, "totalOrderingUsers": 50, "repeatUsers": 20 },
    "aovTrend": [{ "month": "2026-01", "aov": 32, "orderCount": 18 }],
    "popularHours": [{ "hour": "19:00", "count": 12 }]
  }
}
```

---

## Notification APIs

**Note (2025-12-20):** User notification list/mark/delete now use Server Actions in `src/actions/notifications.actions.ts`. The legacy `/api/notifications*` routes were removed.

### 27. Get User Notifications

**Endpoint:** `GET /rest/v1/notifications?user_id=eq.{user_id}&order=created_at.desc`  
**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Order Completed",
    "message": "Your stringing order is ready for pickup!",
    "type": "order",
    "read": false,
    "action_url": "/orders/uuid",
    "created_at": "2025-12-11T12:00:00Z"
  }
]
```

---

### 28. Mark Notification as Read

**Endpoint:** `PATCH /rest/v1/notifications?id=eq.{notification_id}`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "read": true
}
```

---

### 29. Send Notification (Admin)

**Endpoint:** `POST /functions/v1/send-notification`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "user_id": null,  // null = broadcast to all
  "title": "New Promotion",
  "message": "Get 20% off on all packages this week!",
  "type": "promo",
  "action_url": "/packages"
}
```

**Business Logic:**
- Creates notification record(s)
- Optionally sends push notification via FCM

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications_created": 150,
    "push_sent": 120
  }
}
```

---

## Analytics APIs

### 30. Get Popular Strings

**Endpoint:** `POST /functions/v1/analytics-popular-strings`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "period": "month",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "string_id": "uuid",
      "brand": "YONEX",
      "model": "BG66UM",
      "order_count": 45,
      "revenue": 1260.00,
      "profit": 450.00
    }
  ]
}
```

---

### 31. Get User Growth

**Endpoint:** `POST /functions/v1/analytics-user-growth`  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "group_by": "month"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-12",
      "new_users": 25,
      "total_users": 180
    }
  ]
}
```

---

## Error Handling

### Standard Error Codes

| Code                     | HTTP Status | Description                          |
|--------------------------|-------------|--------------------------------------|
| `AUTH_REQUIRED`          | 401         | Authentication required              |
| `FORBIDDEN`              | 403         | Insufficient permissions             |
| `NOT_FOUND`              | 404         | Resource not found                   |
| `INVALID_INPUT`          | 400         | Invalid request parameters           |
| `INSUFFICIENT_POINTS`    | 400         | Not enough points                    |
| `PACKAGE_UNAVAILABLE`    | 400         | Package not available or depleted    |
| `STOCK_UNAVAILABLE`      | 400         | String out of stock                  |
| `PAYMENT_FAILED`         | 400         | Payment processing failed            |
| `VOUCHER_EXPIRED`        | 400         | Voucher has expired                  |
| `VOUCHER_INVALID`        | 400         | Voucher cannot be applied            |
| `INTERNAL_ERROR`         | 500         | Server error                         |

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "You need 50 points but only have 30 points",
    "details": {
      "required": 50,
      "available": 30
    }
  }
}
```

---

## Rate Limiting

- Authenticated endpoints: **100 requests/minute/user**
- Public endpoints: **30 requests/minute/IP**
- Payment webhooks: **No limit** (signature verified)

---

## Webhooks

### Payment Gateway Callbacks

**Expected Signature Header:** `X-Signature` (provider-specific)

**Verification:** HMAC-SHA256 using webhook secret

**Retry Policy:** 
- Max 3 retries with exponential backoff
- Manual reconciliation for failed webhooks

---

## Notes

- All datetime fields use ISO 8601 format with timezone
- All monetary amounts are in **MYR (RM)** with 2 decimal places
- Pagination uses `limit` and `offset` parameters
- File uploads (images) use local storage in `/public/uploads/`

---

**End of API Specification**
