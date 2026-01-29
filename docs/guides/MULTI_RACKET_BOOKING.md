# Multi-Racket Booking System

**String Service Platform — Multi-Racket Order Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The multi-racket booking system allows users to submit multiple rackets for stringing in a single order. This streamlines the process for players with multiple rackets and enables batch pricing.

---

## Features

- Order 1-5 rackets in a single transaction
- Individual string and tension selection per racket
- Photo upload for each racket
- Package session deduction per racket
- Combined payment and tracking

---

## User Flow

### Booking Steps

```
1. Start New Order
   └── Choose "Add Racket" or "Multiple Rackets"

2. For Each Racket:
   ├── Select string type
   ├── Set tension (vertical/horizontal)
   ├── Upload racket photo (optional)
   └── Add notes (optional)

3. Review Order
   ├── See all rackets
   ├── Apply voucher (one per order)
   └── Choose package or pay per item

4. Payment
   └── Single payment for all rackets

5. Tracking
   └── View progress of each racket
```

---

## API Endpoints

### Create Multi-Racket Order

**Endpoint:** `POST /api/orders`
**Auth Required:** Yes

**Request Body:**

```json
{
  "items": [
    {
      "stringId": "string-uuid-1",
      "tensionVertical": 26,
      "tensionHorizontal": 24,
      "racketPhoto": "https://cdn.example.com/racket1.jpg",
      "notes": "Main racket - prefer tight strings"
    },
    {
      "stringId": "string-uuid-2",
      "tensionVertical": 28,
      "tensionHorizontal": 26,
      "racketPhoto": "https://cdn.example.com/racket2.jpg",
      "notes": "Backup racket"
    }
  ],
  "usePackage": true,
  "voucherId": "voucher-uuid",
  "notes": "Tournament this weekend, need by Friday"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "pending",
    "itemCount": 2,
    "totalPrice": 56.00,
    "discountAmount": 5.00,
    "finalPrice": 51.00,
    "items": [
      {
        "id": "item-uuid-1",
        "string": { "brand": "YONEX", "model": "BG66UM" },
        "tensionVertical": 26,
        "tensionHorizontal": 24,
        "price": 28.00
      },
      {
        "id": "item-uuid-2",
        "string": { "brand": "YONEX", "model": "BG80" },
        "tensionVertical": 28,
        "tensionHorizontal": 26,
        "price": 28.00
      }
    ],
    "createdAt": "2026-01-27T10:00:00Z"
  }
}
```

---

### Get Order Details

**Endpoint:** `GET /api/orders/{id}`
**Auth Required:** Yes

Returns full order with all items:

```json
{
  "ok": true,
  "data": {
    "id": "order-uuid",
    "status": "in_progress",
    "itemCount": 2,
    "completedCount": 1,
    "items": [
      {
        "id": "item-uuid-1",
        "status": "completed",
        "string": { "brand": "YONEX", "model": "BG66UM" },
        "tensionVertical": 26,
        "tensionHorizontal": 24,
        "racketPhoto": "https://...",
        "completedAt": "2026-01-27T14:00:00Z"
      },
      {
        "id": "item-uuid-2",
        "status": "in_progress",
        "string": { "brand": "YONEX", "model": "BG80" },
        "tensionVertical": 28,
        "tensionHorizontal": 26,
        "racketPhoto": "https://..."
      }
    ]
  }
}
```

---

## Database Schema

### Order Table

```prisma
model Order {
  id            String      @id @default(cuid())
  userId        String
  status        String      @default("pending")
  totalPrice    Float
  discountAmount Float      @default(0)
  finalPrice    Float
  voucherId     String?
  usePackage    Boolean     @default(false)
  packageId     String?
  notes         String?
  eta           DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User        @relation(fields: [userId], references: [id])
  items         OrderItem[]
  payments      Payment[]
  photos        OrderPhoto[]
  statusLogs    OrderStatusLog[]

  @@map("orders")
}
```

### OrderItem Table

```prisma
model OrderItem {
  id              String    @id @default(cuid())
  orderId         String
  stringId        String
  tensionVertical Int
  tensionHorizontal Int?
  racketPhoto     String?
  notes           String?
  price           Float
  status          String    @default("pending")
  completedAt     DateTime?
  createdAt       DateTime  @default(now())

  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  string          StringInventory @relation(fields: [stringId], references: [id])

  @@map("order_items")
}
```

---

## Components

### MultiRacketBookingFlow

**File:** `src/features/booking/MultiRacketBookingFlow.tsx`

Main booking component:

```tsx
<MultiRacketBookingFlow
  onComplete={handleOrderComplete}
  initialItems={[]}
  maxItems={5}
/>
```

Features:
- Add/remove racket cards
- String selector per racket
- Tension input with presets
- Photo upload
- Real-time price calculation

---

### RacketItemCard

**File:** `src/features/booking/RacketItemCard.tsx`

Individual racket configuration:

```tsx
<RacketItemCard
  index={0}
  item={racketItem}
  strings={availableStrings}
  onUpdate={handleUpdate}
  onRemove={handleRemove}
  removable={itemCount > 1}
/>
```

---

### StringSelector

**File:** `src/features/booking/StringSelector.tsx`

String type selection:

```tsx
<StringSelector
  strings={strings}
  selectedId={selectedStringId}
  onSelect={handleStringSelect}
  showPrices={true}
/>
```

Features:
- String grid with images
- Brand filtering
- Price display
- Stock indicator

---

### ServiceMethodSelector

**File:** `src/features/booking/ServiceMethodSelector.tsx`

Choose payment method:

```tsx
<ServiceMethodSelector
  hasPackage={true}
  packageRemaining={3}
  itemCount={2}
  onMethodChange={handleMethodChange}
/>
```

Options:
- Use package sessions
- Pay per item
- Hybrid (if supported)

---

## Pricing Logic

### Standard Pricing

```typescript
function calculateOrderPrice(items: OrderItem[]): PriceBreakdown {
  let subtotal = 0;

  for (const item of items) {
    subtotal += item.string.sellingPrice;
  }

  return {
    subtotal,
    itemCount: items.length,
    perItemAverage: subtotal / items.length
  };
}
```

### Package Usage

```typescript
function calculateWithPackage(
  items: OrderItem[],
  userPackage: UserPackage
): PackageResult {
  const sessionsNeeded = items.length;
  const sessionsAvailable = userPackage.remaining;

  if (sessionsAvailable >= sessionsNeeded) {
    return {
      usePackage: true,
      sessionsUsed: sessionsNeeded,
      amountToPay: 0
    };
  } else {
    // Partial package usage
    const paidItems = items.slice(sessionsAvailable);
    return {
      usePackage: true,
      sessionsUsed: sessionsAvailable,
      amountToPay: calculateItemsTotal(paidItems)
    };
  }
}
```

### Voucher Application

```typescript
function applyVoucher(
  subtotal: number,
  voucher: Voucher
): DiscountResult {
  if (voucher.type === 'fixed') {
    const discount = Math.min(voucher.value, subtotal);
    return { discount, finalPrice: subtotal - discount };
  } else {
    // percentage
    let discount = subtotal * (voucher.value / 100);
    if (voucher.maxDiscount) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
    return { discount, finalPrice: subtotal - discount };
  }
}
```

---

## Status Management

### Order Status vs Item Status

| Order Status | Description |
|--------------|-------------|
| `pending` | Awaiting payment |
| `pending_payment` | Payment initiated |
| `confirmed` | Payment received, awaiting work |
| `in_progress` | At least one item being worked on |
| `completed` | All items completed |
| `cancelled` | Order cancelled |

| Item Status | Description |
|-------------|-------------|
| `pending` | Not yet started |
| `in_progress` | Being strung |
| `completed` | Stringing done |

### Status Transition Logic

```typescript
function updateOrderStatus(order: Order): string {
  const items = order.items;
  const completed = items.filter(i => i.status === 'completed').length;
  const inProgress = items.filter(i => i.status === 'in_progress').length;

  if (completed === items.length) {
    return 'completed';
  } else if (completed > 0 || inProgress > 0) {
    return 'in_progress';
  } else {
    return order.status; // Keep current
  }
}
```

---

## Admin Workflow

### Processing Multi-Racket Orders

1. View order in Admin > Orders
2. See all racket items with their strings/tensions
3. Update individual item status as completed
4. Upload completion photos per item
5. Order auto-updates to "completed" when all items done

### Admin Order Detail View

Shows:
- Order summary (total items, price)
- Individual racket cards with:
  - String type and tension
  - Racket photo
  - Status toggle
  - Completion timestamp

---

## Inventory Deduction

When order items are completed:

```typescript
async function completeOrderItem(itemId: string) {
  const item = await prisma.orderItem.findUnique({ ... });

  // Deduct stock
  await prisma.stringInventory.update({
    where: { id: item.stringId },
    data: { stock: { decrement: 1 } }
  });

  // Log stock change
  await prisma.stockLog.create({
    data: {
      stringId: item.stringId,
      change: -1,
      type: 'sale',
      referenceId: item.orderId
    }
  });

  // Update item status
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { status: 'completed', completedAt: new Date() }
  });

  // Check if order is fully complete
  await updateOrderStatus(item.orderId);
}
```

---

## Package Session Deduction

When using package for multi-racket order:

```typescript
async function deductPackageSessions(
  userPackageId: string,
  count: number
) {
  await prisma.userPackage.update({
    where: { id: userPackageId },
    data: { remaining: { decrement: count } }
  });
}
```

---

## Limitations

- Maximum 5 rackets per order
- Cannot mix package and paid items in single order (future feature)
- Single voucher per order (applied to total)
- All items must use same payment method

---

## Future Enhancements

1. **Hybrid payment** - Use package for some, pay for others
2. **Bundle discounts** - Automatic discount for 3+ rackets
3. **Recurring orders** - Schedule regular restringing
4. **Team orders** - Multiple users in single order

---

**End of Multi-Racket Booking Documentation**
