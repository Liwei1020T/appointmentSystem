# Service Architecture

**String Service Platform — Service Layer Documentation**
**Version:** 2.0
**Last Updated:** 2026-02-01

---

## Overview

The service layer provides a clean abstraction between API routes and the database. Services encapsulate business logic, ensuring consistency across the application.

---

## Architecture

本项目采用 **双层服务架构**，将客户端 API 调用与服务端业务逻辑清晰分离：

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│                  (src/features/**/*.tsx)                     │
│                  (src/components/**/*.tsx)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Client Services (API Client Layer)              │
│                    (src/services/*.ts)                       │
│                                                              │
│  职责：封装 HTTP 请求，调用 API 路由                          │
│  运行环境：浏览器                                             │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ orderService│  │paymentService│ │profileService│         │
│  │ fetch(API)  │  │  fetch(API) │  │  fetch(API) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP Request
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│              (src/app/api/**/route.ts)                       │
│                                                              │
│  职责：请求验证、认证检查、调用服务端服务                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Server Services (Business Logic Layer)            │
│               (src/server/services/*.ts)                     │
│                                                              │
│  职责：业务逻辑、数据库操作、事务处理                          │
│  运行环境：服务器 (Node.js)                                   │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │order.service│  │payment.service│ │profile.service│       │
│  │  Prisma     │  │   Prisma    │  │   Prisma    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Libraries                         │
│                    (src/lib/*.ts)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prisma Client                              │
│                  (src/lib/prisma.ts)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 双层服务架构说明

### 为什么采用双层架构？

| 层级 | 目录 | 职责 | 运行环境 |
|------|------|------|----------|
| **Client Services** | `src/services/` | 封装 HTTP 请求 | 浏览器 |
| **Server Services** | `src/server/services/` | 业务逻辑 + 数据库操作 | Node.js 服务器 |

### 请求流程示例

以获取订单详情为例：

```
1. [浏览器] OrderDetailPage 组件调用 getOrderById(orderId)
                    ↓
2. [浏览器] src/services/orderService.ts
           → fetch('/api/orders/' + orderId)
                    ↓
3. [服务器] src/app/api/orders/[id]/route.ts
           → 验证认证 → 调用 getOrderById(userId, orderId)
                    ↓
4. [服务器] src/server/services/order.service.ts
           → prisma.order.findUnique({ where: { id: orderId } })
                    ↓
5. [数据库] PostgreSQL 返回订单数据
```

### 代码示例对比

**Client Service (src/services/orderService.ts)**
```typescript
// 封装 HTTP 请求，运行在浏览器
export async function getOrderById(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${orderId}`);
}
```

**Server Service (src/server/services/order.service.ts)**
```typescript
// 业务逻辑 + 数据库操作，运行在服务器
export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: orderDetailInclude,
  });

  if (!order) {
    throw new ApiError('ORDER_NOT_FOUND', 404, '订单不存在');
  }

  return order;
}
```

### 命名约定

| 层级 | 文件命名 | 示例 |
|------|----------|------|
| Client Services | camelCase | `orderService.ts`, `paymentService.ts` |
| Server Services | kebab-case + `.service` | `order.service.ts`, `payment.service.ts` |

### 使用规则

1. **React 组件** 只能调用 `src/services/` 中的客户端服务
2. **API 路由** 只能调用 `src/server/services/` 中的服务端服务
3. **服务端服务** 可以相互调用，但应避免循环依赖
4. **客户端服务** 不能直接导入 Prisma 或其他服务端模块

---

## Service Catalog

### Client Services (src/services/)

> 运行在浏览器，封装 HTTP 请求

#### 核心业务服务

| Service | File | Description |
|---------|------|-------------|
| `orderService` | orderService.ts | 订单 API 调用封装 |
| `paymentService` | paymentService.ts | 支付 API 调用封装 |
| `packageService` | packageService.ts | 套餐 API 调用封装 |
| `voucherService` | voucherService.ts | 优惠券 API 调用封装 |
| `pointsService` | pointsService.ts | 积分 API 调用封装 |
| `reviewService` | reviewService.ts | 评价 API 调用封装 |
| `referralService` | referralService.ts | 推荐 API 调用封装 |
| `inventoryService` | inventoryService.ts | 库存 API 调用封装 |

#### 用户服务

| Service | File | Description |
|---------|------|-------------|
| `authService` | authService.ts | 用户认证 |
| `profileService` | profileService.ts | 个人资料 |
| `notificationService` | notificationService.ts | 通知服务 |

#### 管理端服务

| Service | File | Description |
|---------|------|-------------|
| `adminOrderService` | adminOrderService.ts | 管理端订单 API |
| `adminUserService` | adminUserService.ts | 用户管理 API |
| `adminPackageService` | adminPackageService.ts | 套餐管理 API |
| `adminVoucherService` | adminVoucherService.ts | 优惠券管理 API |
| `adminStatsService` | adminStatsService.ts | 统计数据 API |
| `adminReportsService` | adminReportsService.ts | 报表 API |
| `adminAuthService` | adminAuthService.ts | 管理员认证 |

#### 支持服务

| Service | File | Description |
|---------|------|-------------|
| `imageUploadService` | imageUploadService.ts | 图片上传 |
| `orderPhotosService` | orderPhotosService.ts | 订单照片 |
| `tngPaymentService` | tngPaymentService.ts | TNG 支付 |
| `completeOrderService` | completeOrderService.ts | 订单完成 |
| `homeService` | homeService.ts | 首页数据 |
| `webPushService` | webPushService.ts | 推送通知 |
| `realtimeService` | realtimeService.ts | 实时更新 |

#### 工具服务

| Service | File | Description |
|---------|------|-------------|
| `apiClient` | apiClient.ts | HTTP 客户端封装 |
| `requestCache` | requestCache.ts | 请求去重缓存 |

---

### Server Services (src/server/services/)

> 运行在服务器，包含业务逻辑和数据库操作

#### 核心业务服务

| Service | File | Description |
|---------|------|-------------|
| `order.service` | order.service.ts | 订单创建、查询、取消、完成 |
| `payment.service` | payment.service.ts | 支付处理、验证、退款 |
| `package.service` | package.service.ts | 套餐购买、使用、查询 |
| `voucher.service` | voucher.service.ts | 优惠券兑换、应用、恢复 |
| `points.service` | points.service.ts | 积分发放、扣减、计算 |
| `review.service` | review.service.ts | 评价创建、查询、统计 |
| `referral.service` | referral.service.ts | 推荐追踪、奖励发放 |
| `inventory.service` | inventory.service.ts | 库存管理、扣减、日志 |
| `membership.service` | membership.service.ts | 会员等级计算、升级 |

#### 订单相关服务

| Service | File | Description |
|---------|------|-------------|
| `order-automation.service` | order-automation.service.ts | 订单自动化流程 |
| `order-eta.service` | order-eta.service.ts | 预计完成时间计算 |
| `order-photos.service` | order-photos.service.ts | 订单照片处理 |
| `order-status.service` | order-status.service.ts | 订单状态变更 |

#### 管理端服务

| Service | File | Description |
|---------|------|-------------|
| `admin-order.service` | admin-order.service.ts | 管理端订单操作 |
| `admin-package.service` | admin-package.service.ts | 套餐 CRUD |

#### 其他服务

| Service | File | Description |
|---------|------|-------------|
| `analytics.service` | analytics.service.ts | 数据分析 |
| `notification.service` | notification.service.ts | 通知发送 |
| `profile.service` | profile.service.ts | 用户资料 |
| `promotion.service` | promotion.service.ts | 促销活动 |
| `restock.service` | restock.service.ts | 补货管理 |
| `stats.service` | stats.service.ts | 统计计算 |
| `welcome.service` | welcome.service.ts | 首单欢迎逻辑 |

---

## Service Patterns

### Standard Service Structure

```typescript
// src/services/exampleService.ts

import { prisma } from '@/lib/prisma';
import { ExampleInput, ExampleOutput } from '@/types';

/**
 * Get example by ID
 */
export async function getExampleById(id: string): Promise<Example | null> {
  return prisma.example.findUnique({
    where: { id },
    include: { related: true }
  });
}

/**
 * Create new example
 */
export async function createExample(
  data: ExampleInput
): Promise<ExampleOutput> {
  // Validation
  if (!data.required) {
    throw new Error('Required field missing');
  }

  // Business logic
  const processed = processData(data);

  // Database operation
  const result = await prisma.example.create({
    data: processed
  });

  // Side effects
  await notifyCreation(result);

  return result;
}

/**
 * Update example
 */
export async function updateExample(
  id: string,
  data: Partial<ExampleInput>
): Promise<ExampleOutput> {
  return prisma.example.update({
    where: { id },
    data
  });
}

/**
 * Delete example
 */
export async function deleteExample(id: string): Promise<void> {
  await prisma.example.delete({
    where: { id }
  });
}
```

---

### Error Handling Pattern

```typescript
import { AppError } from '@/lib/api-errors';

export async function riskyOperation(id: string) {
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) {
    throw new AppError('ITEM_NOT_FOUND', 'Item does not exist', 404);
  }

  if (item.status === 'locked') {
    throw new AppError('ITEM_LOCKED', 'Item is locked', 400);
  }

  try {
    return await processItem(item);
  } catch (error) {
    // Log error but throw generic message
    console.error('Process failed:', error);
    throw new AppError('PROCESS_FAILED', 'Failed to process item', 500);
  }
}
```

---

### Transaction Pattern

```typescript
export async function complexOperation(data: Input) {
  return prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: { ... }
    });

    // Deduct inventory
    await tx.stringInventory.update({
      where: { id: data.stringId },
      data: { stock: { decrement: 1 } }
    });

    // Create payment
    const payment = await tx.payment.create({
      data: { orderId: order.id, ... }
    });

    // Log
    await tx.stockLog.create({
      data: { stringId: data.stringId, change: -1, ... }
    });

    return { order, payment };
  });
}
```

---

## Key Services Deep Dive

### orderService.ts

**Core Functions:**

```typescript
// Create order (single or multi-racket)
async function createOrder(userId: string, data: CreateOrderInput): Promise<Order>

// Get user's orders with pagination
async function getUserOrders(userId: string, options: QueryOptions): Promise<Order[]>

// Get single order with full details
async function getOrderById(orderId: string): Promise<Order | null>

// Cancel pending order
async function cancelOrder(orderId: string, userId: string): Promise<Order>

// Complete order (admin)
async function completeOrder(orderId: string): Promise<Order>
```

---

### paymentService.ts

**Core Functions:**

```typescript
// Create payment record
async function createPayment(data: CreatePaymentInput): Promise<Payment>

// Upload payment proof
async function uploadProof(paymentId: string, proofUrl: string): Promise<Payment>

// Verify payment (admin)
async function verifyPayment(paymentId: string, adminId: string): Promise<Payment>

// Reject payment (admin)
async function rejectPayment(paymentId: string, reason: string): Promise<Payment>

// Get pending payments
async function getPendingPayments(): Promise<Payment[]>
```

---

### pointsService.ts

**Core Functions:**

```typescript
// Award points with tier multiplier
async function awardPoints(
  userId: string,
  amount: number,
  description: string,
  reference?: { type: string; id: string }
): Promise<PointsLog>

// Deduct points for redemption
async function deductPoints(
  userId: string,
  amount: number,
  description: string
): Promise<PointsLog>

// Get points balance
async function getBalance(userId: string): Promise<number>

// Get points history
async function getHistory(userId: string, options: QueryOptions): Promise<PointsLog[]>
```

---

### voucherService.ts

**Core Functions:**

```typescript
// Redeem voucher by code
async function redeemByCode(userId: string, code: string): Promise<UserVoucher>

// Redeem with points
async function redeemWithPoints(userId: string, voucherId: string): Promise<UserVoucher>

// Apply voucher to order
async function applyToOrder(userVoucherId: string, orderId: string): Promise<ApplyResult>

// Calculate discount
function calculateDiscount(voucher: Voucher, amount: number): number

// Restore voucher on cancellation
async function restoreVoucher(userVoucherId: string): Promise<void>
```

---

### completeOrderService.ts

**Purpose:** Handles the complete order completion flow including inventory, points, and notifications.

**Core Functions:**

```typescript
// Complete an order and trigger all side effects
async function completeOrder(orderId: string): Promise<CompleteResult> {
  // 1. Update order status to completed
  // 2. Mark all order items as completed
  // 3. Deduct inventory for each item
  // 4. Create stock logs
  // 5. Calculate and award points (with tier multiplier)
  // 6. Send completion notification
  // 7. Create review prompt
}

// Complete individual order item
async function completeOrderItem(itemId: string): Promise<OrderItem>

// Calculate profit for completed order
function calculateOrderProfit(order: Order): number
```

---

### webPushService.ts

**Purpose:** Manages web push notifications using the Web Push API.

**Core Functions:**

```typescript
// Send push notification to user
async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<SendResult>

// Subscribe user to push notifications
async function subscribe(
  userId: string,
  subscription: PushSubscription
): Promise<void>

// Unsubscribe user from push notifications
async function unsubscribe(userId: string): Promise<void>

// Send push to all subscribers (broadcast)
async function broadcast(payload: PushPayload): Promise<BroadcastResult>
```

**Configuration:**

```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@example.com
```

---

### realtimeService.ts

**Purpose:** Provides real-time updates for order status changes using polling or server-sent events.

**Core Functions:**

```typescript
// Subscribe to order updates
function subscribeToOrder(
  orderId: string,
  callback: (status: OrderStatus) => void
): Unsubscribe

// Subscribe to user notifications
function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): Unsubscribe

// Trigger update for order status change
async function notifyOrderUpdate(orderId: string): Promise<void>

// Get real-time connection status
function getConnectionStatus(): ConnectionStatus
```

**Usage in Components:**

```tsx
// In OrderDetailPage
useEffect(() => {
  const unsubscribe = subscribeToOrder(orderId, (newStatus) => {
    setOrderStatus(newStatus);
  });
  return () => unsubscribe();
}, [orderId]);
```

---

### requestCache.ts

**Purpose:** Deduplicates concurrent identical API requests to improve performance.

**Core Functions:**

```typescript
// Get cached response or execute request
async function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T>

// Invalidate cache for specific key
function invalidate(key: string): void

// Invalidate all cache entries matching pattern
function invalidatePattern(pattern: RegExp): void

// Clear entire cache
function clearAll(): void
```

**Usage Example:**

```typescript
// In API route - prevents duplicate DB queries
export async function GET(request: Request) {
  const userId = await getUserId(request);

  return cachedRequest(
    `user:${userId}:orders`,
    () => prisma.order.findMany({ where: { userId } }),
    5000 // 5 second TTL
  );
}
```

---

## Utility Libraries

### lib/prisma.ts

Singleton Prisma client:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

### lib/api-response.ts

Standard API response helpers:

```typescript
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status }
  );
}
```

---

### lib/api-errors.ts

Custom error class:

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

---

### lib/server-auth.ts

Authentication helpers:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAuth(): Promise<User> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AppError('AUTH_REQUIRED', 'Authentication required', 401);
  }
  return session.user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new AppError('FORBIDDEN_ADMIN_ONLY', 'Admin access required', 403);
  }
  return user;
}
```

---

### lib/validation.ts

Input validation helpers:

```typescript
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({
    stringId: z.string().cuid(),
    tensionVertical: z.number().min(15).max(35),
    tensionHorizontal: z.number().min(15).max(35).optional(),
    notes: z.string().max(500).optional()
  })).min(1).max(5),
  usePackage: z.boolean().optional(),
  voucherId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional()
});

export function validateInput<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('VALIDATION_FAILED', result.error.message, 400);
  }
  return result.data;
}
```

---

### lib/membership.ts

Membership tier calculations:

```typescript
export function calculateTier(totalSpent: number, totalOrders: number): MembershipTier {
  if (totalSpent >= 5000 && totalOrders >= 50) return 'VIP';
  if (totalSpent >= 3000 && totalOrders >= 30) return 'GOLD';
  if (totalSpent >= 1500 && totalOrders >= 15) return 'SILVER';
  if (totalSpent >= 500 && totalOrders >= 5) return 'BRONZE';
  return 'REGULAR';
}

export function getPointsMultiplier(tier: MembershipTier): number {
  const multipliers = { REGULAR: 1, BRONZE: 1.1, SILVER: 1.25, GOLD: 1.5, VIP: 2 };
  return multipliers[tier];
}
```

---

## Best Practices

### 1. Service Boundaries

- Services should not call other services directly
- Use events or orchestration layer for cross-service operations
- Keep services focused on single domain

### 2. Error Handling

- Always throw `AppError` with specific codes
- Log errors with context
- Never expose internal errors to clients

### 3. Transactions

- Use transactions for multi-table operations
- Keep transactions short
- Handle rollback scenarios

### 4. Testing

- Unit test business logic
- Mock Prisma for service tests
- Test error cases

### 5. Documentation

- Document function parameters
- Explain business logic in comments
- Keep service files focused

---

**End of Service Architecture Documentation**
