# 🔌 API Specification

**String Service Platform — API Reference**  
**Version:** 1.0  
**Last Updated:** 2025-12-11  
**Backend:** Supabase Edge Functions + PostgreSQL RPC

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

### Base URL

```
Supabase Edge Functions: https://<project-ref>.supabase.co/functions/v1
Supabase REST API: https://<project-ref>.supabase.co/rest/v1
```

### Authentication

All authenticated endpoints require:
- Header: `Authorization: Bearer <JWT_TOKEN>`
- Token obtained from Supabase Auth

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Authentication

### 1. Sign Up

**Endpoint:** `POST /auth/v1/signup`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "data": {
    "full_name": "John Doe",
    "phone": "+60123456789",
    "referred_by": "ABCD1234"  // Optional
  }
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe",
      "phone": "+60123456789"
    }
  }
}
```

**Trigger:** Creates user profile in `users` table, generates referral code, processes referral reward if code provided.

---

### 2. Sign In

**Endpoint:** `POST /auth/v1/token?grant_type=password`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as Sign Up

---

### 3. Get User Profile

**Endpoint:** `GET /rest/v1/users?id=eq.{user_id}`  
**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+60123456789",
  "referral_code": "ABCD1234",
  "referred_by": "XYZW5678",
  "points": 150,
  "role": "customer",
  "created_at": "2025-12-11T10:00:00Z"
}
```

---

## User APIs

### 4. Update Profile

**Endpoint:** `PATCH /rest/v1/users?id=eq.{user_id}`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "phone": "+60198765432"
}
```

**Response:** Updated user object

---

### 5. Get Points History

**Endpoint:** `GET /rest/v1/points_log?user_id=eq.{user_id}&order=created_at.desc`  
**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "uuid",
    "amount": 10,
    "type": "order",
    "description": "Order completed",
    "balance_after": 150,
    "created_at": "2025-12-11T10:00:00Z"
  }
]
```

---

## Order APIs

### 6. Create Order

**Endpoint:** `POST /functions/v1/create-order`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "string_id": "uuid",
  "tension": 26,
  "notes": "Please string by tomorrow",
  "use_package": false,
  "package_id": null,  // If use_package is true
  "voucher_id": null   // Optional
}
```

**Business Logic:**
- Validates string availability
- Calculates price (from `string_inventory.selling_price`)
- Applies voucher discount if provided
- If `use_package` is true:
  - Validates user has active package
  - Deducts one use from package
  - Sets order price to 0
- Creates order record with status `pending`
- Returns order object and payment details (if payment required)

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "user_id": "uuid",
      "string_id": "uuid",
      "tension": 26,
      "price": 28.00,
      "discount": 0,
      "status": "pending",
      "created_at": "2025-12-11T10:00:00Z"
    },
    "payment_required": true,
    "payment_url": "https://payment-gateway.com/pay/xxx"  // If applicable
  }
}
```

---

### 7. Get User Orders

**Endpoint:** `GET /rest/v1/orders?user_id=eq.{user_id}&order=created_at.desc`  
**Auth Required:** Yes

**Query Parameters:**
- `status=eq.completed` - Filter by status
- `limit=10` - Pagination

**Response:**
```json
[
  {
    "id": "uuid",
    "string_id": "uuid",
    "string": {
      "brand": "YONEX",
      "model": "BG66UM",
      "color": "White"
    },
    "tension": 26,
    "price": 28.00,
    "status": "completed",
    "completed_at": "2025-12-11T12:00:00Z",
    "created_at": "2025-12-11T10:00:00Z"
  }
]
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

## Payment APIs

### 9. Create Payment

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

### 10. Payment Webhook

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

### 11. Get Payment History

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

> 说明：以下端点为前端占位接口，用于避免 404/HTML 响应导致的崩溃。返回统一的 `{ success, data }` 结构，需在接入真实 Supabase/Edge Functions 后替换。

- `GET /api/vouchers/stats` → `{ total: 0, used: 0, expired: 0, active: 0, usageRate: 0 }`。  
- `GET /api/admin/vouchers/stats` → `{ issued: 0, used: 0, active: 0, usageRate: 0 }`。  
- `GET /api/admin/vouchers/user/:userId` → `{ vouchers: [] }`。  
- `POST /api/admin/vouchers/:id/distribute` → `{ distributed: 0, skipped: 0, sample: [] }`。  
- `GET /api/admin/packages` → `{ packages: [] }`；`GET /api/admin/packages/stats`、`/sales` → `{ stats: {} }` 占位。  
- Admin 报表占位：`/api/admin/reports/summary|revenue|profit|sales|top-strings|top-packages|user-growth|order-trends`（JSON），`/export`（CSV 字符串）。  
- 评价占位：`POST /api/reviews` 保存评价并回传提交内容；`GET /api/reviews/featured` / `user` → `{ reviews: [] }`；`GET /api/reviews/order/:orderId` → `{ review: null }`（或返回单条评价）。
- 备注：数据库已存在 `reviews` 表（字段：rating/comment/photos 等）；以上接口为占位，不持久化。

### Local Implemented Endpoints (Next.js App Router)

- `GET /api/user/vouchers` → Prisma `user_vouchers` + `vouchers` 联表，返回 `{ vouchers: [...] }`（需要登录）。  
- `GET /api/vouchers/redeemable` → Prisma `vouchers` 表筛选 active + valid window，返回 `{ vouchers: [...] }`（需要登录）。  
- `POST /api/vouchers/redeem-with-points` → 使用积分兑换指定 `voucherId`，写入 `user_vouchers` 与 `points_log`（需要登录）。  

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

## Notification APIs

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
- Filtering uses PostgREST query syntax
- File uploads (images) use Supabase Storage with public URLs

---

**End of API Specification**
