# Order System

**String Service Platform — Order Management Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The order system manages the complete lifecycle of stringing orders, from creation through payment, processing, and completion.

---

## Order Lifecycle

### Status Flow

```
┌──────────┐     ┌─────────────────┐     ┌───────────┐
│  draft   │ ──▶ │ pending_payment │ ──▶ │ confirmed │
└──────────┘     └─────────────────┘     └───────────┘
                        │                      │
                        │ (timeout)            ▼
                        ▼               ┌─────────────┐
                  ┌───────────┐        │ in_progress │
                  │ cancelled │        └─────────────┘
                  └───────────┘              │
                        ▲                    ▼
                        │              ┌───────────┐
                        └───────────── │ completed │
                         (user cancel) └───────────┘
```

### Status Definitions

| Status | Description | Next States |
|--------|-------------|-------------|
| `draft` | Order being created | pending_payment |
| `pending_payment` | Awaiting payment | confirmed, cancelled |
| `confirmed` | Payment received | in_progress, cancelled |
| `in_progress` | Being processed | completed |
| `completed` | All items done | - |
| `cancelled` | Order cancelled | - |

---

## API Endpoints

### Create Order

**Endpoint:** `POST /api/orders`
**Auth Required:** Yes

**Single Racket:**

```json
{
  "stringId": "string-uuid",
  "tension": 26,
  "notes": "Please string by tomorrow"
}
```

**Multi-Racket:**

```json
{
  "items": [
    {
      "stringId": "string-uuid-1",
      "tensionVertical": 26,
      "tensionHorizontal": 24,
      "racketPhoto": "https://...",
      "notes": "Main racket"
    },
    {
      "stringId": "string-uuid-2",
      "tensionVertical": 28,
      "tensionHorizontal": 26
    }
  ],
  "usePackage": false,
  "voucherId": "voucher-uuid",
  "notes": "Tournament this weekend"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "pending_payment",
    "itemCount": 2,
    "totalPrice": 56.00,
    "discountAmount": 5.00,
    "finalPrice": 51.00,
    "createdAt": "2026-01-27T10:00:00Z"
  }
}
```

---

### Get User Orders

**Endpoint:** `GET /api/orders`
**Auth Required:** Yes

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `limit` | number | Results per page (default: 20) |
| `page` | number | Page number (default: 1) |

**Response:**

```json
{
  "ok": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "status": "completed",
        "itemCount": 2,
        "finalPrice": 51.00,
        "createdAt": "2026-01-27T10:00:00Z",
        "completedAt": "2026-01-27T18:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get Order Details

**Endpoint:** `GET /api/orders/{id}`
**Auth Required:** Yes (owner or admin)

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "in_progress",
    "itemCount": 2,
    "completedCount": 1,
    "totalPrice": 56.00,
    "discountAmount": 5.00,
    "finalPrice": 51.00,
    "usePackage": false,
    "notes": "Tournament this weekend",
    "eta": "2026-01-27T18:00:00Z",
    "items": [
      {
        "id": "item-uuid-1",
        "status": "completed",
        "string": {
          "id": "string-uuid",
          "brand": "YONEX",
          "model": "BG66UM",
          "color": "White"
        },
        "tensionVertical": 26,
        "tensionHorizontal": 24,
        "racketPhoto": "https://...",
        "completedAt": "2026-01-27T14:00:00Z"
      },
      {
        "id": "item-uuid-2",
        "status": "in_progress",
        "string": {
          "id": "string-uuid-2",
          "brand": "YONEX",
          "model": "BG80"
        },
        "tensionVertical": 28,
        "tensionHorizontal": 26
      }
    ],
    "voucher": {
      "id": "voucher-uuid",
      "code": "SAVE5",
      "value": 5.00
    },
    "payment": {
      "id": "payment-uuid",
      "status": "success",
      "amount": 51.00,
      "paidAt": "2026-01-27T10:30:00Z"
    },
    "photos": [
      {
        "id": "photo-uuid",
        "url": "/uploads/orders/order-uuid/photo-1.jpg"
      }
    ],
    "statusLogs": [
      {
        "status": "pending_payment",
        "notes": null,
        "createdAt": "2026-01-27T10:00:00Z"
      },
      {
        "status": "confirmed",
        "notes": "Payment verified",
        "createdAt": "2026-01-27T10:30:00Z"
      }
    ],
    "createdAt": "2026-01-27T10:00:00Z"
  }
}
```

---

### Cancel Order

**Endpoint:** `POST /api/orders/{id}/cancel`
**Auth Required:** Yes (owner only)

**Conditions:**
- Order must be in `pending_payment` or `confirmed` status
- Cannot cancel `in_progress` or `completed` orders

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "cancelled",
    "voucherRestored": true,
    "packageSessionsRestored": 0
  }
}
```

**Side Effects:**
- Voucher restored to active (if applied)
- Package sessions restored (if used)
- User notified

---

### Complete Order (Admin)

**Endpoint:** `POST /api/orders/{id}/complete`
**Auth Required:** Yes (Admin only)

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "completed",
    "completedAt": "2026-01-27T18:00:00Z",
    "pointsAwarded": 51
  }
}
```

**Side Effects:**
- All item statuses updated to `completed`
- Inventory deducted for each item
- Points awarded to user
- User notified
- Review prompt created

---

## Admin Endpoints

### Get All Orders

**Endpoint:** `GET /api/admin/orders`
**Auth Required:** Yes (Admin only)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `q` | string | Search by user name/phone |
| `page` | number | Page number |
| `limit` | number | Results per page |

---

### Update Order Status

**Endpoint:** `PATCH /api/admin/orders/{id}/status`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "status": "in_progress",
  "notes": "Started stringing, ETA 3 hours"
}
```

---

### Set Order ETA

**Endpoint:** `POST /api/admin/orders/{id}/eta`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "eta": "2026-01-27T18:00:00Z"
}
```

---

### Get Order Statistics

**Endpoint:** `GET /api/admin/orders/stats`
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `startDate`: Start of period
- `endDate`: End of period

**Response:**

```json
{
  "ok": true,
  "data": {
    "total": 150,
    "pending": 5,
    "inProgress": 8,
    "completed": 130,
    "cancelled": 7,
    "revenue": 4500.00,
    "averageValue": 30.00
  }
}
```

---

## Database Schema

### Order Table

```prisma
model Order {
  id              String      @id @default(cuid())
  userId          String
  status          String      @default("pending_payment")
  totalPrice      Float
  discountAmount  Float       @default(0)
  finalPrice      Float
  voucherId       String?
  usePackage      Boolean     @default(false)
  packageId       String?
  notes           String?
  eta             DateTime?
  completedAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  voucher         UserVoucher? @relation(fields: [voucherId], references: [id])
  items           OrderItem[]
  payments        Payment[]
  photos          OrderPhoto[]
  statusLogs      OrderStatusLog[]
  review          Review?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}
```

### OrderItem Table

```prisma
model OrderItem {
  id                String    @id @default(cuid())
  orderId           String
  stringId          String
  tensionVertical   Int
  tensionHorizontal Int?
  racketPhoto       String?
  notes             String?
  price             Float
  status            String    @default("pending")
  completedAt       DateTime?
  createdAt         DateTime  @default(now())

  order             Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  string            StringInventory @relation(fields: [stringId], references: [id])

  @@map("order_items")
}
```

### OrderStatusLog Table

```prisma
model OrderStatusLog {
  id        String   @id @default(cuid())
  orderId   String
  status    String
  notes     String?
  createdBy String?
  createdAt DateTime @default(now())

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_status_logs")
}
```

---

## Components

### OrderTimeline

**File:** `src/components/OrderTimeline.tsx`

Displays order progress:

```tsx
<OrderTimeline
  status="in_progress"
  statusLogs={order.statusLogs}
  createdAt={order.createdAt}
  eta={order.eta}
/>
```

---

### OrderStatusBadge

**File:** `src/components/OrderStatusBadge.tsx`

Status indicator badge:

```tsx
<OrderStatusBadge status="in_progress" />
```

---

### OrderPaymentSection

**File:** `src/components/OrderPaymentSection.tsx`

Payment options for pending orders:

```tsx
<OrderPaymentSection
  orderId={order.id}
  amount={order.finalPrice}
  onPaymentComplete={handleComplete}
/>
```

---

## Service Implementation

**File:** `src/services/orderService.ts`

### Key Functions

```typescript
// Create order
async function createOrder(
  userId: string,
  data: CreateOrderInput
): Promise<Order>

// Get user's orders
async function getUserOrders(
  userId: string,
  options: QueryOptions
): Promise<PaginatedResult<Order>>

// Get order by ID
async function getOrderById(orderId: string): Promise<Order | null>

// Cancel order
async function cancelOrder(
  orderId: string,
  userId: string
): Promise<Order>

// Complete order (admin)
async function completeOrder(orderId: string): Promise<Order>
```

---

## Order Creation Logic

### Validation

```typescript
function validateOrder(data: CreateOrderInput) {
  // Check items exist
  if (!data.items?.length && !data.stringId) {
    throw new Error('ORDER_NO_ITEMS');
  }

  // Check string availability
  for (const item of data.items) {
    const string = await getStringById(item.stringId);
    if (!string || !string.active || string.stock < 1) {
      throw new Error('INVENTORY_OUT_OF_STOCK');
    }
  }

  // Check voucher validity
  if (data.voucherId) {
    const voucher = await getUserVoucher(data.voucherId);
    if (!voucher || voucher.status !== 'active') {
      throw new Error('VOUCHER_INVALID');
    }
  }

  // Check package availability
  if (data.usePackage) {
    const pkg = await getActivePackage(data.userId);
    if (!pkg || pkg.remaining < data.items.length) {
      throw new Error('PACKAGE_NO_REMAINING');
    }
  }
}
```

### Price Calculation

```typescript
function calculateOrderPrice(
  items: OrderItemInput[],
  voucher?: UserVoucher,
  usePackage?: boolean
): PriceResult {
  // Calculate subtotal
  let subtotal = 0;
  for (const item of items) {
    const string = getStringById(item.stringId);
    subtotal += string.sellingPrice;
  }

  // Apply package (free if using package)
  if (usePackage) {
    return { totalPrice: subtotal, discountAmount: subtotal, finalPrice: 0 };
  }

  // Apply voucher discount
  let discount = 0;
  if (voucher) {
    discount = calculateVoucherDiscount(voucher, subtotal);
  }

  return {
    totalPrice: subtotal,
    discountAmount: discount,
    finalPrice: subtotal - discount
  };
}
```

---

## Notifications

### Order Confirmed

```
Title: "Order Confirmed"
Message: "Your order #12345 has been confirmed. We'll start working on it soon!"
```

### Order In Progress

```
Title: "Stringing Started"
Message: "We've started stringing your racket(s) for order #12345."
```

### Order Completed

```
Title: "Order Ready!"
Message: "Your order #12345 is complete! Pick up your racket(s) at our shop."
```

### Order Cancelled

```
Title: "Order Cancelled"
Message: "Your order #12345 has been cancelled. Any vouchers have been restored."
```

---

## Best Practices

1. **Always validate stock** before creating order
2. **Use transactions** for order creation
3. **Log all status changes** for audit trail
4. **Notify users** on every status change
5. **Set realistic ETAs** based on queue

---

**End of Order System Documentation**
