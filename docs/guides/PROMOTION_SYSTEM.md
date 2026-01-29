# Promotion System

**String Service Platform — Marketing Campaign Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

The promotion system enables admins to create and manage marketing campaigns that offer discounts to customers. Promotions can be time-limited, usage-capped, and targeted to specific conditions.

---

## Promotion Types

| Type | Code | Description |
|------|------|-------------|
| Flash Sale | `FLASH_SALE` | Limited-time discount on all orders |
| Points Boost | `POINTS_BOOST` | Multiplied points earning |
| Spend & Save | `SPEND_SAVE` | Discount when spending above threshold |
| Bundle Deal | `BUNDLE_DEAL` | Discount for multiple items |
| New User | `NEW_USER` | First-time customer discount |

---

## Discount Types

| Type | Description | Example |
|------|-------------|---------|
| `PERCENTAGE` | Percentage off order total | 10% off |
| `FIXED` | Fixed amount discount | RM 5 off |

---

## API Endpoints

### Get Active Promotions (Admin)

**Endpoint:** `GET /api/admin/promotions`
**Auth Required:** Yes (Admin only)

**Response:**

```json
{
  "ok": true,
  "data": {
    "promotions": [
      {
        "id": "promo-uuid",
        "name": "New Year Flash Sale",
        "type": "FLASH_SALE",
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "minPurchase": 30,
        "maxDiscount": 20,
        "startAt": "2026-01-01T00:00:00Z",
        "endAt": "2026-01-31T23:59:59Z",
        "usageLimit": 100,
        "usageCount": 45,
        "active": true,
        "createdAt": "2025-12-28T10:00:00Z"
      }
    ],
    "usageSummary": {
      "totalSavedAmount": 450.00,
      "totalUsageCount": 45
    }
  }
}
```

---

### Create Promotion (Admin)

**Endpoint:** `POST /api/admin/promotions`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "name": "Weekend Special",
  "type": "FLASH_SALE",
  "discountType": "PERCENTAGE",
  "discountValue": 15,
  "minPurchase": 50,
  "maxDiscount": 30,
  "startAt": "2026-02-01T00:00:00Z",
  "endAt": "2026-02-02T23:59:59Z",
  "usageLimit": 50,
  "active": true
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "promo-uuid",
    "name": "Weekend Special",
    "type": "FLASH_SALE",
    "createdAt": "2026-01-27T10:00:00Z"
  }
}
```

---

### Update Promotion (Admin)

**Endpoint:** `PATCH /api/admin/promotions/{id}`
**Auth Required:** Yes (Admin only)

**Request Body:**

```json
{
  "name": "Extended Weekend Special",
  "endAt": "2026-02-03T23:59:59Z",
  "usageLimit": 100
}
```

---

### Delete Promotion (Admin)

**Endpoint:** `DELETE /api/admin/promotions/{id}`
**Auth Required:** Yes (Admin only)

**Note:** Cannot delete promotions with usage records. Deactivate instead.

---

## Database Schema

### Promotion Table

```prisma
model Promotion {
  id            String    @id @default(cuid())
  name          String
  description   String?
  type          String    // FLASH_SALE, POINTS_BOOST, SPEND_SAVE, etc.
  discountType  String    // PERCENTAGE, FIXED
  discountValue Float
  minPurchase   Float?
  maxDiscount   Float?
  startAt       DateTime
  endAt         DateTime
  usageLimit    Int?
  usageCount    Int       @default(0)
  active        Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  usages        PromotionUsage[]

  @@map("promotions")
}
```

### PromotionUsage Table

```prisma
model PromotionUsage {
  id           String   @id @default(cuid())
  promotionId  String
  userId       String
  orderId      String?
  savedAmount  Float
  createdAt    DateTime @default(now())

  promotion    Promotion @relation(fields: [promotionId], references: [id])
  user         User      @relation(fields: [userId], references: [id])

  @@map("promotion_usages")
}
```

---

## Discount Calculation

### Percentage Discount

```typescript
function calculatePercentageDiscount(
  orderAmount: number,
  discountValue: number,
  maxDiscount?: number
): number {
  let discount = orderAmount * (discountValue / 100);

  if (maxDiscount) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.round(discount * 100) / 100;
}
```

### Fixed Discount

```typescript
function calculateFixedDiscount(
  orderAmount: number,
  discountValue: number
): number {
  return Math.min(discountValue, orderAmount);
}
```

### Application Logic

```typescript
async function applyPromotion(
  orderId: string,
  promotionId: string,
  orderAmount: number
): Promise<ApplyResult> {
  const promotion = await getPromotion(promotionId);

  // Validate promotion
  if (!promotion.active) {
    throw new Error('PROMOTION_INACTIVE');
  }

  if (new Date() < promotion.startAt || new Date() > promotion.endAt) {
    throw new Error('PROMOTION_NOT_VALID');
  }

  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    throw new Error('PROMOTION_LIMIT_REACHED');
  }

  if (promotion.minPurchase && orderAmount < promotion.minPurchase) {
    throw new Error('PROMOTION_MIN_PURCHASE');
  }

  // Calculate discount
  let discount: number;
  if (promotion.discountType === 'PERCENTAGE') {
    discount = calculatePercentageDiscount(
      orderAmount,
      promotion.discountValue,
      promotion.maxDiscount
    );
  } else {
    discount = calculateFixedDiscount(orderAmount, promotion.discountValue);
  }

  // Record usage
  await prisma.promotionUsage.create({
    data: {
      promotionId,
      userId: order.userId,
      orderId,
      savedAmount: discount
    }
  });

  // Increment usage count
  await prisma.promotion.update({
    where: { id: promotionId },
    data: { usageCount: { increment: 1 } }
  });

  return { discount, finalPrice: orderAmount - discount };
}
```

---

## Points Boost Promotion

Special promotion type that multiplies points earned:

```typescript
async function applyPointsBoost(
  userId: string,
  basePoints: number
): Promise<number> {
  const activeBoost = await prisma.promotion.findFirst({
    where: {
      type: 'POINTS_BOOST',
      active: true,
      startAt: { lte: new Date() },
      endAt: { gte: new Date() }
    }
  });

  if (!activeBoost) {
    return basePoints;
  }

  // discountValue represents multiplier (e.g., 2 = 2x points)
  const multiplier = activeBoost.discountValue;
  const boostedPoints = Math.floor(basePoints * multiplier);

  // Record usage
  await prisma.promotionUsage.create({
    data: {
      promotionId: activeBoost.id,
      userId,
      savedAmount: boostedPoints - basePoints // Extra points earned
    }
  });

  return boostedPoints;
}
```

---

## Admin Dashboard

### Promotion Statistics

**Endpoint:** `GET /api/admin/analytics`

Returns promotion performance metrics:

```json
{
  "promotions": {
    "activeCount": 3,
    "totalUsage": 245,
    "totalSaved": 1250.00,
    "topPromotion": {
      "name": "New Year Sale",
      "usageCount": 120
    }
  }
}
```

### Usage Analytics

Track promotion effectiveness:

| Metric | Description |
|--------|-------------|
| Usage Count | Times promotion was applied |
| Total Saved | Sum of discounts given |
| Average Discount | Average discount per use |
| Conversion Rate | Orders with promotion vs total |

---

## Components

### PromotionBanner

**File:** `src/components/PromotionBanner.tsx`

Displays active promotions to users:

```tsx
<PromotionBanner
  promotion={activePromotion}
  onDismiss={handleDismiss}
/>
```

---

### AdminPromotionList

**File:** `src/components/admin/AdminPromotionList.tsx`

Admin promotion management:

```tsx
<AdminPromotionList
  promotions={promotions}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCreate={handleCreate}
/>
```

---

## Best Practices

### Creating Effective Promotions

1. **Clear naming** - Use descriptive names users understand
2. **Reasonable limits** - Set usage limits to control costs
3. **Time boundaries** - Always set start and end dates
4. **Minimum purchase** - Encourage higher order values
5. **Track performance** - Monitor usage and adjust

### Avoiding Common Issues

1. **Overlapping promotions** - Don't stack multiple discounts
2. **Unlimited usage** - Always set reasonable limits
3. **No expiry** - Always set end dates
4. **Over-discounting** - Use maxDiscount for percentages

---

## Notifications

### Promotion Started

```
Title: "Flash Sale!"
Message: "Get 15% off all orders this weekend. Use before Feb 2!"
```

### Promotion Ending

```
Title: "Sale Ending Soon"
Message: "Only 2 hours left for our 15% off sale. Order now!"
```

---

**End of Promotion System Documentation**
