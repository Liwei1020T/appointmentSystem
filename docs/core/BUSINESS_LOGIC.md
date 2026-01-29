# Business Logic Reference

**String Service Platform — Algorithm & Rule Documentation**
**Version:** 1.0
**Last Updated:** 2026-01-27

---

## Overview

This document describes the core business logic algorithms and rules used throughout the platform.

---

## 1. Order ETA Calculation

### Algorithm

```typescript
function calculateOrderEta(orderId: string): EtaResult {
  // 1. Get queue position
  const ordersAhead = await getOrdersAhead(orderId);

  // 2. Calculate stringing time per order
  const avgStringingTime = 30; // minutes
  const totalMinutes = ordersAhead * avgStringingTime;

  // 3. Account for shop hours (10 AM - 8 PM)
  const shopOpenHour = 10;
  const shopCloseHour = 20;
  const workHoursPerDay = shopCloseHour - shopOpenHour; // 10 hours

  // 4. Calculate estimated completion
  let eta = new Date();
  let remainingMinutes = totalMinutes;

  while (remainingMinutes > 0) {
    const currentHour = eta.getHours();

    if (currentHour < shopOpenHour) {
      eta.setHours(shopOpenHour, 0, 0, 0);
    } else if (currentHour >= shopCloseHour) {
      eta.setDate(eta.getDate() + 1);
      eta.setHours(shopOpenHour, 0, 0, 0);
    } else {
      const minutesUntilClose = (shopCloseHour - currentHour) * 60;
      const workableMinutes = Math.min(remainingMinutes, minutesUntilClose);
      eta.setMinutes(eta.getMinutes() + workableMinutes);
      remainingMinutes -= workableMinutes;
    }
  }

  return { eta, queuePosition: ordersAhead + 1 };
}
```

### Factors

| Factor | Value |
|--------|-------|
| Average stringing time | 30 minutes |
| Shop open hours | 10:00 AM - 8:00 PM |
| Multi-racket orders | Count as multiple (n × 30 min) |
| Priority orders | Skip queue calculation |

---

## 2. Membership Tier Calculation

### Tier Thresholds

| Tier | Min Spend | Min Orders |
|------|-----------|------------|
| Regular | RM 0 | 0 |
| Bronze | RM 500 | 5 |
| Silver | RM 1,500 | 15 |
| Gold | RM 3,000 | 30 |
| VIP | RM 5,000 | 50 |

### Algorithm

```typescript
function calculateTier(totalSpent: number, totalOrders: number): MembershipTier {
  // Both conditions must be met for upgrade
  if (totalSpent >= 5000 && totalOrders >= 50) return 'VIP';
  if (totalSpent >= 3000 && totalOrders >= 30) return 'GOLD';
  if (totalSpent >= 1500 && totalOrders >= 15) return 'SILVER';
  if (totalSpent >= 500 && totalOrders >= 5) return 'BRONZE';
  return 'REGULAR';
}
```

### Points Multipliers

| Tier | Multiplier |
|------|------------|
| Regular | 1.0x |
| Bronze | 1.1x |
| Silver | 1.25x |
| Gold | 1.5x |
| VIP | 2.0x |

---

## 3. Points Calculation

### Earning Points

```typescript
function calculateOrderPoints(
  orderAmount: number,
  membershipTier: MembershipTier
): number {
  // Base: 1 point per RM spent
  const basePoints = Math.floor(orderAmount);

  // Apply tier multiplier
  const multiplier = getPointsMultiplier(membershipTier);

  return Math.floor(basePoints * multiplier);
}
```

### Example

| Order Amount | Tier | Base Points | Multiplier | Final Points |
|--------------|------|-------------|------------|--------------|
| RM 50 | Regular | 50 | 1.0 | 50 |
| RM 50 | Bronze | 50 | 1.1 | 55 |
| RM 50 | Silver | 50 | 1.25 | 62 |
| RM 50 | Gold | 50 | 1.5 | 75 |
| RM 50 | VIP | 50 | 2.0 | 100 |

---

## 4. Voucher Discount Calculation

### Fixed Amount Voucher

```typescript
function calculateFixedDiscount(
  orderAmount: number,
  voucherValue: number
): number {
  // Discount cannot exceed order amount
  return Math.min(voucherValue, orderAmount);
}
```

### Percentage Voucher

```typescript
function calculatePercentageDiscount(
  orderAmount: number,
  percentage: number,
  maxDiscount?: number
): number {
  let discount = orderAmount * (percentage / 100);

  // Apply max discount cap if exists
  if (maxDiscount) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.round(discount * 100) / 100;
}
```

### Voucher Applicability

```typescript
function isVoucherApplicable(
  voucher: Voucher,
  orderAmount: number,
  userId: string
): { applicable: boolean; reason?: string } {
  // Check expiry
  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    return { applicable: false, reason: 'VOUCHER_EXPIRED' };
  }

  // Check minimum purchase
  if (voucher.minPurchase && orderAmount < voucher.minPurchase) {
    return { applicable: false, reason: 'VOUCHER_MIN_ORDER' };
  }

  // Check usage limit
  if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
    return { applicable: false, reason: 'VOUCHER_LIMIT_REACHED' };
  }

  // Check if already used by user
  if (voucher.status === 'used') {
    return { applicable: false, reason: 'VOUCHER_ALREADY_USED' };
  }

  return { applicable: true };
}
```

---

## 5. Package Eligibility

### Eligibility Rules

```typescript
function checkPackageEligibility(
  userPackage: UserPackage,
  itemCount: number
): { eligible: boolean; reason?: string } {
  // Check active status
  if (userPackage.status !== 'active') {
    return { eligible: false, reason: 'PACKAGE_INACTIVE' };
  }

  // Check expiry
  if (userPackage.expiry && new Date() > userPackage.expiry) {
    return { eligible: false, reason: 'PACKAGE_EXPIRED' };
  }

  // Check remaining sessions
  if (userPackage.remaining < itemCount) {
    return { eligible: false, reason: 'PACKAGE_NO_REMAINING' };
  }

  return { eligible: true };
}
```

### Session Deduction

```typescript
function deductPackageSessions(
  userPackageId: string,
  count: number
): Promise<UserPackage> {
  return prisma.userPackage.update({
    where: { id: userPackageId },
    data: {
      remaining: { decrement: count },
      updatedAt: new Date()
    }
  });
}
```

---

## 6. Referral Reward Distribution

### Reward Flow

```
New User Signs Up with Referral Code
           │
           ▼
    Create ReferralLog (status: pending)
           │
           ▼
    New User Completes First Order
           │
           ▼
    ┌──────┴──────┐
    ▼             ▼
Award Referrer   Update ReferralLog
  50 Points      (status: completed)
    │
    ▼
Send Notification
```

### Algorithm

```typescript
async function processReferralCompletion(referredUserId: string) {
  // Find pending referral
  const referral = await prisma.referralLog.findFirst({
    where: {
      referredId: referredUserId,
      status: 'pending'
    }
  });

  if (!referral) return;

  // Award points to referrer
  await awardPoints(
    referral.referrerId,
    REFERRAL_REWARD_POINTS, // 50
    'Referral reward',
    'referral',
    referral.id
  );

  // Update referral status
  await prisma.referralLog.update({
    where: { id: referral.id },
    data: {
      status: 'completed',
      pointsAwarded: REFERRAL_REWARD_POINTS,
      completedAt: new Date()
    }
  });

  // Notify referrer
  await createNotification({
    userId: referral.referrerId,
    title: 'Referral Reward!',
    message: `You earned ${REFERRAL_REWARD_POINTS} points!`,
    type: 'referral'
  });
}
```

---

## 7. Order Auto-Cancellation

### Timeout Logic

```typescript
const PAYMENT_TIMEOUT_HOURS = 24;

async function processOrderAutomation() {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - PAYMENT_TIMEOUT_HOURS);

  // Find expired orders
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'pending_payment',
      createdAt: { lt: cutoffTime }
    }
  });

  for (const order of expiredOrders) {
    // Cancel order
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' }
    });

    // Restore voucher if used
    if (order.voucherId) {
      await restoreVoucher(order.voucherId);
    }

    // Restore package sessions if used
    if (order.usePackage && order.packageId) {
      const itemCount = await getOrderItemCount(order.id);
      await restorePackageSessions(order.packageId, itemCount);
    }

    // Notify user
    await createNotification({
      userId: order.userId,
      title: 'Order Cancelled',
      message: 'Your order was cancelled due to payment timeout.',
      type: 'order'
    });
  }

  return { cancelled: expiredOrders.length };
}
```

---

## 8. Inventory Restock Suggestions

### Algorithm

```typescript
function calculateRestockSuggestion(item: StringInventory): RestockSuggestion {
  const { stock, minimumStock, avgMonthlySales } = item;

  // Calculate days until stockout
  const dailySales = avgMonthlySales / 30;
  const daysUntilStockout = dailySales > 0 ? stock / dailySales : Infinity;

  // Calculate suggested order quantity
  const targetStock = minimumStock * 3; // 3 months buffer
  const suggestedQuantity = Math.max(0, targetStock - stock);

  // Determine urgency
  let urgency: 'critical' | 'warning' | 'normal';
  if (stock <= minimumStock) {
    urgency = 'critical';
  } else if (daysUntilStockout < 30) {
    urgency = 'warning';
  } else {
    urgency = 'normal';
  }

  return {
    currentStock: stock,
    minimumStock,
    suggestedQuantity,
    daysUntilStockout: Math.floor(daysUntilStockout),
    urgency
  };
}
```

---

## 9. First-Order Voucher Guard

### Eligibility Check

```typescript
async function isEligibleForFirstOrderVoucher(userId: string): Promise<boolean> {
  // Check if user has any completed orders
  const completedOrders = await prisma.order.count({
    where: {
      userId,
      status: 'completed'
    }
  });

  // Only eligible if no completed orders
  return completedOrders === 0;
}

async function issueFirstOrderVoucher(userId: string): Promise<UserVoucher | null> {
  // Check eligibility
  if (!await isEligibleForFirstOrderVoucher(userId)) {
    return null;
  }

  // Find auto-issue first-order voucher
  const voucher = await prisma.voucher.findFirst({
    where: {
      isAutoIssue: true,
      isFirstOrderOnly: true,
      active: true
    }
  });

  if (!voucher) return null;

  // Check if already has this voucher
  const existing = await prisma.userVoucher.findFirst({
    where: { userId, voucherId: voucher.id }
  });

  if (existing) return null;

  // Issue voucher
  const expiresAt = voucher.validityDays
    ? new Date(Date.now() + voucher.validityDays * 24 * 60 * 60 * 1000)
    : null;

  return prisma.userVoucher.create({
    data: {
      userId,
      voucherId: voucher.id,
      status: 'active',
      expiresAt
    }
  });
}
```

---

## 10. Promotion Application

### Stacking Rules

- Only **one** promotion can be applied per order
- Promotions and vouchers **can** be combined
- Package usage **excludes** promotions (already discounted)

### Priority Order

1. User-selected voucher (manual)
2. Active promotion (automatic)
3. Membership discount (future feature)

### Application Logic

```typescript
async function applyBestPromotion(
  orderAmount: number,
  userId: string
): Promise<AppliedPromotion | null> {
  // Find active promotions
  const promotions = await prisma.promotion.findMany({
    where: {
      active: true,
      startAt: { lte: new Date() },
      endAt: { gte: new Date() },
      OR: [
        { usageLimit: null },
        { usageCount: { lt: prisma.promotion.fields.usageLimit } }
      ]
    }
  });

  // Calculate discount for each
  let bestPromotion = null;
  let bestDiscount = 0;

  for (const promo of promotions) {
    // Check minimum purchase
    if (promo.minPurchase && orderAmount < promo.minPurchase) {
      continue;
    }

    // Calculate discount
    const discount = calculatePromotionDiscount(promo, orderAmount);

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestPromotion = promo;
    }
  }

  return bestPromotion
    ? { promotion: bestPromotion, discount: bestDiscount }
    : null;
}
```

---

## 11. Review Sharing

### Share URL Generation

```typescript
function generateReviewShareUrl(reviewId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://string.app';
  return `${baseUrl}/reviews/public/${reviewId}`;
}

function getWhatsAppShareLink(review: Review): string {
  const text = encodeURIComponent(
    `Check out my review of ${review.string.brand} ${review.string.model}! ⭐️${'⭐'.repeat(review.rating - 1)}`
  );
  const url = encodeURIComponent(generateReviewShareUrl(review.id));
  return `https://wa.me/?text=${text}%20${url}`;
}
```

---

## 12. Admin Order Notes

### Note Persistence

```typescript
async function addOrderStatusNote(
  orderId: string,
  status: string,
  notes: string,
  adminId: string
): Promise<OrderStatusLog> {
  return prisma.orderStatusLog.create({
    data: {
      orderId,
      status,
      notes,
      createdBy: adminId,
      createdAt: new Date()
    }
  });
}
```

### Display Logic

```typescript
function formatOrderNotes(statusLogs: OrderStatusLog[]): FormattedNote[] {
  return statusLogs
    .filter(log => log.notes) // Only logs with notes
    .map(log => ({
      status: log.status,
      note: log.notes,
      timestamp: log.createdAt,
      author: log.createdBy
    }))
    .sort((a, b) => b.timestamp - a.timestamp); // Newest first
}
```

---

## Edge Cases

### Order Cancellation with Package + Voucher

```typescript
async function handleOrderCancellation(orderId: string) {
  const order = await getOrderWithDetails(orderId);

  // 1. Restore voucher
  if (order.voucherId) {
    await prisma.userVoucher.update({
      where: { id: order.voucherId },
      data: { status: 'active', usedAt: null }
    });
  }

  // 2. Restore package sessions
  if (order.usePackage && order.userPackageId) {
    const itemCount = order.items.length;
    await prisma.userPackage.update({
      where: { id: order.userPackageId },
      data: { remaining: { increment: itemCount } }
    });
  }

  // 3. Do NOT restore points (not awarded until completion)
  // 4. Do NOT restore inventory (not deducted until completion)
}
```

### Partial Package Usage

When package has fewer sessions than order items:

```typescript
function calculateHybridPayment(
  items: OrderItem[],
  userPackage: UserPackage
): HybridPaymentResult {
  const packageCovers = userPackage.remaining;
  const paidItems = items.slice(packageCovers);

  const paidAmount = paidItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  return {
    sessionsUsed: packageCovers,
    itemsPaid: paidItems.length,
    amountToPay: paidAmount
  };
}
```

---

**End of Business Logic Reference**
