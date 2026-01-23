# Phased Optimizations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a three-phase optimization roadmap (quick wins → core efficiency → strategic alignment) that strengthens conversion, operational reliability, and insight depth without breaking existing flows.

**Architecture:** Build on the existing Next.js App Router + Prisma service layer. Add minimal schema fields via SQL migrations in `sql/migrations/`, keep API contracts updated in `docs/core/api_spec.md`, and use cron-style Route Handlers for scheduled reminders. New logic should live in `src/server/services/*` with thin API handlers and UI surfaces in `src/features/*` and `src/components/*`.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Prisma + PostgreSQL, Vitest, Zod.

---

## Phase 1 — Quick Wins (2 weeks)

### Task 1: Align referral tier rewards to product spec (50/80/100)

**Files:**
- Modify: `src/server/services/referral.service.ts`
- Test: `src/__tests__/referralRewards.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { getReferralTier } from '@/server/services/referral.service';

describe('getReferralTier', () => {
  it('returns 50 points for 1-5 referrals', () => {
    expect(getReferralTier(1).points).toBe(50);
    expect(getReferralTier(5).points).toBe(50);
  });

  it('returns 80 points for 6-10 referrals', () => {
    expect(getReferralTier(6).points).toBe(80);
    expect(getReferralTier(10).points).toBe(80);
  });

  it('returns 100 points for 11+ referrals', () => {
    expect(getReferralTier(11).points).toBe(100);
    expect(getReferralTier(50).points).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/referralRewards.test.ts`
Expected: FAIL (points not matching 100/80/50 tiers)

**Step 3: Write minimal implementation**

```ts
export const REFERRAL_TIERS = [
  { min: 1, max: 5, points: 50, badge: null },
  { min: 6, max: 10, points: 80, badge: 'referral_bronze' },
  { min: 11, max: Infinity, points: 100, badge: 'referral_silver' },
];
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/referralRewards.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/referral.service.ts src/__tests__/referralRewards.test.ts
git commit -m "feat: align referral tier rewards to spec"
```

---

### Task 2: Add first-order-only flag to packages (schema + seed)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/023_package_first_order_only.sql`
- Modify: `prisma/seed.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { isUserEligibleForFirstOrderPackage } from '@/server/services/package.service';

// Use an in-memory stub or mock in implementation step.
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/packageEligibility.test.ts`
Expected: FAIL (function missing)

**Step 3: Write minimal implementation**

```prisma
model Package {
  // ...existing fields
  isFirstOrderOnly Boolean @default(false) @map("is_first_order_only")
}
```

```sql
ALTER TABLE packages
ADD COLUMN is_first_order_only BOOLEAN DEFAULT FALSE;
```

```ts
// prisma/seed.ts
await prisma.package.create({
  data: {
    name: '首单体验价',
    description: '首次穿线特价，仅限新用户',
    times: 1,
    price: 18,
    validityDays: 30,
    tag: 'limited_time',
    isFirstOrderOnly: true,
    active: true,
  },
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/packageEligibility.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma sql/migrations/023_package_first_order_only.sql prisma/seed.ts
git commit -m "feat: add first-order-only package flag"
```

---

### Task 3: Enforce first-order eligibility in package listing and purchase flow

**Files:**
- Modify: `src/server/services/package.service.ts`
- Modify: `src/app/api/packages/route.ts`
- Test: `src/__tests__/packageEligibility.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { isUserEligibleForFirstOrderPackage } from '@/server/services/package.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn().mockResolvedValue(0) },
  },
}));

describe('isUserEligibleForFirstOrderPackage', () => {
  it('returns true when user has no completed or in-progress orders', async () => {
    await expect(isUserEligibleForFirstOrderPackage('user-1')).resolves.toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/packageEligibility.test.ts`
Expected: FAIL (function returns false or missing)

**Step 3: Write minimal implementation**

```ts
export async function isUserEligibleForFirstOrderPackage(userId: string) {
  const orderCount = await prisma.order.count({
    where: {
      userId,
      status: { in: ['in_progress', 'completed'] },
    },
  });
  return orderCount === 0;
}
```

```ts
// When listing packages for a user
if (!eligible) {
  packages = packages.filter((pkg) => !pkg.isFirstOrderOnly);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/packageEligibility.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/package.service.ts src/app/api/packages/route.ts src/__tests__/packageEligibility.test.ts
git commit -m "feat: gate first-order packages by eligibility"
```

---

### Task 4: Show first-order offer in package UI

**Files:**
- Modify: `src/components/PackageCard.tsx`
- Modify: `src/features/packages/PackagesCenter.tsx`
- Test: `src/__tests__/PackageCard.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import PackageCard from '@/components/PackageCard';

it('shows first-order badge when package is first-order-only', () => {
  render(
    <PackageCard
      package={{
        id: 'pkg-1',
        name: '首单体验价',
        price: 18,
        times: 1,
        isFirstOrderOnly: true,
      } as any}
    />
  );

  expect(screen.getByText('首单特价')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/PackageCard.test.tsx`
Expected: FAIL (badge missing)

**Step 3: Write minimal implementation**

```tsx
{pkg.isFirstOrderOnly && (
  <Badge variant="info" className="bg-accent/10 text-accent border border-accent/30">
    首单特价
  </Badge>
)}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/PackageCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/PackageCard.tsx src/features/packages/PackagesCenter.tsx src/__tests__/PackageCard.test.tsx
git commit -m "feat: surface first-order package badge"
```

---

### Task 5: Add renewal discount fields + expiry reminder cron

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/024_package_renewal_discount.sql`
- Modify: `src/server/services/package.service.ts`
- Create: `src/app/api/admin/cron/package-renewal/route.ts`
- Test: `src/__tests__/packageRenewal.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { getRenewalDiscountForUser } from '@/server/services/package.service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPackage: {
      findFirst: vi.fn().mockResolvedValue({ expiry: new Date(Date.now() + 5 * 86400000) }),
    },
    package: { findUnique: vi.fn().mockResolvedValue({ renewalDiscount: 5 }) },
  },
}));

describe('getRenewalDiscountForUser', () => {
  it('returns discount when package expires within 7 days', async () => {
    await expect(getRenewalDiscountForUser('user-1', 'pkg-1')).resolves.toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/packageRenewal.test.ts`
Expected: FAIL (function missing)

**Step 3: Write minimal implementation**

```prisma
model Package {
  // ...existing fields
  renewalDiscount Int @default(0) @map("renewal_discount")
}
```

```sql
ALTER TABLE packages
ADD COLUMN renewal_discount INT DEFAULT 0;
```

```ts
const RENEWAL_WINDOW_DAYS = 7;

export async function getRenewalDiscountForUser(userId: string, packageId: string) {
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || pkg.renewalDiscount <= 0) return 0;

  const expiring = await prisma.userPackage.findFirst({
    where: {
      userId,
      packageId,
      expiry: { lte: new Date(Date.now() + RENEWAL_WINDOW_DAYS * 86400000) },
    },
  });

  return expiring ? pkg.renewalDiscount : 0;
}
```

```ts
// Cron route: POST /api/admin/cron/package-renewal
// Send notifications for packages expiring within 7 days.
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/packageRenewal.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma sql/migrations/024_package_renewal_discount.sql src/server/services/package.service.ts src/app/api/admin/cron/package-renewal/route.ts src/__tests__/packageRenewal.test.ts
git commit -m "feat: add renewal discount and expiry reminder cron"
```

---

### Task 6: Apply renewal discount in package purchase flow

**Files:**
- Modify: `src/server/services/package.service.ts`
- Modify: `src/app/api/packages/buy/route.ts`
- Modify: `src/features/packages/PackagePurchaseFlow.tsx`
- Test: `src/__tests__/packageRenewal.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { applyRenewalDiscount } from '@/server/services/package.service';

describe('applyRenewalDiscount', () => {
  it('returns discounted price when discount is present', () => {
    expect(applyRenewalDiscount(100, 5)).toBe(95);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/packageRenewal.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function applyRenewalDiscount(price: number, discountPercent: number) {
  if (!discountPercent) return price;
  const discounted = price * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/packageRenewal.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/package.service.ts src/app/api/packages/buy/route.ts src/features/packages/PackagePurchaseFlow.tsx src/__tests__/packageRenewal.test.ts
git commit -m "feat: apply renewal discount in purchase flow"
```

---

### Task 7: Add review share with referral code

**Files:**
- Create: `src/lib/share.ts`
- Modify: `src/components/ReviewCard.tsx`
- Test: `src/__tests__/reviewShare.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildReviewShareMessage } from '@/lib/share';

it('includes referral code in share message', () => {
  const message = buildReviewShareMessage({ id: 'review-1', rating: 5 } as any, 'ABC123');
  expect(message).toContain('ABC123');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/reviewShare.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function buildReviewShareMessage(review: { rating: number }, referralCode?: string) {
  const codeLine = referralCode ? `邀请码：${referralCode}` : '';
  return `我在 String Service Platform 的穿线体验很棒！评分 ${review.rating}★\n${codeLine}`.trim();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/reviewShare.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/share.ts src/components/ReviewCard.tsx src/__tests__/reviewShare.test.ts
git commit -m "feat: add review share message helper"
```

---

### Task 8: Supplier info + profit estimate in restock suggestions

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/025_inventory_supplier_fields.sql`
- Modify: `src/server/services/restock.service.ts`
- Modify: `src/components/admin/AdminInventoryDetailPage.tsx`
- Test: `src/__tests__/restockSuggestions.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { calculateSuggestedQuantity } from '@/server/services/restock.service';

describe('calculateSuggestedQuantity', () => {
  it('returns at least minimum restock quantity', () => {
    expect(calculateSuggestedQuantity(0, 5, 1)).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/restockSuggestions.test.ts`
Expected: FAIL (helper not exported)

**Step 3: Write minimal implementation**

```prisma
model StringInventory {
  // ...existing fields
  supplierName    String?  @map("supplier_name")
  supplierContact String?  @map("supplier_contact")
  leadTimeDays    Int      @default(3) @map("lead_time_days")
}
```

```sql
ALTER TABLE string_inventory
ADD COLUMN supplier_name TEXT,
ADD COLUMN supplier_contact TEXT,
ADD COLUMN lead_time_days INT DEFAULT 3;
```

```ts
// restock.service.ts
const estimatedProfit = suggestedQuantity * (sellingPrice - costPrice);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/restockSuggestions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma sql/migrations/025_inventory_supplier_fields.sql src/server/services/restock.service.ts src/components/admin/AdminInventoryDetailPage.tsx src/__tests__/restockSuggestions.test.ts
git commit -m "feat: add supplier fields and profit estimate"
```

---

### Task 9: Auto-advance order status on payment success

**Files:**
- Modify: `src/server/services/payment.service.ts`
- Test: `src/__tests__/paymentStatus.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { shouldAdvanceOrderStatus } from '@/server/services/payment.service';

it('advances pending order after payment success', () => {
  expect(shouldAdvanceOrderStatus('pending', 'success')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/paymentStatus.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function shouldAdvanceOrderStatus(orderStatus: string, paymentStatus: string) {
  return orderStatus === 'pending' && paymentStatus === 'success';
}
```

```ts
if (payment.orderId && shouldAdvanceOrderStatus(order.status, 'success')) {
  await tx.order.update({
    where: { id: payment.orderId },
    data: { status: 'in_progress' },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/paymentStatus.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/payment.service.ts src/__tests__/paymentStatus.test.ts
git commit -m "feat: advance order status after payment success"
```

---

## Phase 2 — Core Efficiency (2 weeks)

### Task 10: Add OrderStatusLog table + lastStatusChangeAt

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `sql/migrations/026_order_status_logs.sql`
- Test: `src/__tests__/orderStatusLog.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { formatStatusLabel } from '@/server/services/order-status.service';

it('formats received status', () => {
  expect(formatStatusLabel('received')).toBe('已收拍');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/orderStatusLog.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```prisma
model OrderStatusLog {
  id        String   @id @default(uuid()) @db.Uuid
  orderId   String   @map("order_id") @db.Uuid
  status    String
  note      String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  order Order @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("order_status_logs")
}

model Order {
  // ...existing fields
  lastStatusChangeAt DateTime @default(now()) @map("last_status_change_at") @db.Timestamptz(6)
}
```

```sql
CREATE TABLE order_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders
ADD COLUMN last_status_change_at timestamptz DEFAULT now();
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/orderStatusLog.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma sql/migrations/026_order_status_logs.sql src/__tests__/orderStatusLog.test.ts
git commit -m "feat: add order status logs and last change timestamp"
```

---

### Task 11: Update admin order status API to log transitions + notes

**Files:**
- Modify: `src/app/api/admin/orders/[id]/status/route.ts`
- Modify: `src/server/services/admin-order.service.ts`
- Test: `src/__tests__/orderStatusLog.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { validateOrderStatus } from '@/server/services/order-status.service';

it('rejects unknown status', () => {
  expect(validateOrderStatus('unknown')).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/orderStatusLog.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
const allowedStatuses = ['pending', 'received', 'in_progress', 'completed', 'picked_up', 'cancelled'];

export function validateOrderStatus(status: string) {
  return allowedStatuses.includes(status);
}
```

```ts
await prisma.orderStatusLog.create({
  data: { orderId, status: nextStatus, note: note || null },
});

await prisma.order.update({
  where: { id: orderId },
  data: { status: nextStatus, lastStatusChangeAt: new Date() },
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/orderStatusLog.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/admin/orders/[id]/status/route.ts src/server/services/admin-order.service.ts src/__tests__/orderStatusLog.test.ts
git commit -m "feat: log admin order status transitions"
```

---

### Task 12: Extend OrderTimeline for new statuses + notes

**Files:**
- Modify: `src/components/OrderTimeline.tsx`
- Modify: `src/features/orders/OrderDetailPage.tsx`
- Test: `src/__tests__/OrderTimeline.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import OrderTimeline from '@/components/OrderTimeline';

it('renders received status label', () => {
  render(
    <OrderTimeline
      currentStatus="received"
      createdAt={new Date().toISOString()}
    />
  );

  expect(screen.getByText('已收拍')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/OrderTimeline.test.tsx`
Expected: FAIL (label missing)

**Step 3: Write minimal implementation**

```ts
received: {
  label: '已收拍',
  icon: CheckCircle,
  color: 'text-info',
  bgColor: 'bg-info-soft',
  borderColor: 'border-info/30',
  iconBg: 'bg-info-soft',
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/OrderTimeline.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/OrderTimeline.tsx src/features/orders/OrderDetailPage.tsx src/__tests__/OrderTimeline.test.tsx
git commit -m "feat: add received/picked-up states to order timeline"
```

---

### Task 13: Admin order notes UI

**Files:**
- Modify: `src/components/admin/AdminOrderDetailPage.tsx`
- Test: `src/__tests__/AdminOrderNotes.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import AdminOrderDetailPage from '@/components/admin/AdminOrderDetailPage';

it('shows order status notes section', () => {
  render(<AdminOrderDetailPage order={{ id: 'order-1', status: 'received' } as any} />);
  expect(screen.getByText('状态备注')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/AdminOrderNotes.test.tsx`
Expected: FAIL (section missing)

**Step 3: Write minimal implementation**

```tsx
<Card className="p-4">
  <h3 className="text-sm font-semibold text-text-primary">状态备注</h3>
  <p className="text-xs text-text-tertiary">管理员可为中间状态添加备注。</p>
</Card>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/AdminOrderNotes.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/AdminOrderDetailPage.tsx src/__tests__/AdminOrderNotes.test.tsx
git commit -m "feat: add admin order status notes section"
```

---

### Task 14: Update order automation to use lastStatusChangeAt

**Files:**
- Modify: `src/server/services/order-automation.service.ts`
- Test: `src/__tests__/orderAutomation.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { isOrderOverdue } from '@/server/services/order-automation.service';

it('flags overdue orders based on lastStatusChangeAt', () => {
  const overdue = isOrderOverdue({ lastStatusChangeAt: new Date('2025-01-01') } as any, 72);
  expect(overdue).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/orderAutomation.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function isOrderOverdue(order: { lastStatusChangeAt: Date }, thresholdHours: number) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - thresholdHours);
  return order.lastStatusChangeAt < cutoff;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/orderAutomation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/order-automation.service.ts src/__tests__/orderAutomation.test.ts
git commit -m "feat: base automation on last status change time"
```

---

## Phase 3 — Strategic Alignment (2 weeks)

### Task 15: Unify membership tier sources (DB enum as single source)

**Files:**
- Modify: `src/lib/membership.ts`
- Modify: `src/server/services/profile.service.ts`
- Modify: `src/components/MembershipCard.tsx`
- Test: `src/__tests__/membershipTiers.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { getTierLabel } from '@/lib/membership';

it('maps DB tiers to labels', () => {
  expect(getTierLabel('SILVER')).toBe('Silver');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/membershipTiers.test.ts`
Expected: FAIL (helper missing or mismatched)

**Step 3: Write minimal implementation**

```ts
export function getTierLabel(tier: string) {
  const labels: Record<string, string> = {
    SILVER: 'Silver',
    GOLD: 'Gold',
    VIP: 'VIP',
  };
  return labels[tier] || 'Silver';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/membershipTiers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/membership.ts src/server/services/profile.service.ts src/components/MembershipCard.tsx src/__tests__/membershipTiers.test.ts
git commit -m "feat: unify membership tiers with DB enum"
```

---

### Task 16: Promotion usage analytics (admin)

**Files:**
- Modify: `src/server/services/promotion.service.ts`
- Modify: `src/app/api/admin/promotions/route.ts`
- Modify: `src/app/admin/promotions/page.tsx`
- Test: `src/__tests__/promotionStats.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { summarizePromotionUsage } from '@/server/services/promotion.service';

it('sums total saved amount', () => {
  const result = summarizePromotionUsage([{ savedAmount: 5 }, { savedAmount: 10 }] as any);
  expect(result.totalSavedAmount).toBe(15);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/promotionStats.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function summarizePromotionUsage(usages: { savedAmount: number }[]) {
  const totalSavedAmount = usages.reduce((sum, entry) => sum + entry.savedAmount, 0);
  return { totalSavedAmount };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/promotionStats.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/promotion.service.ts src/app/api/admin/promotions/route.ts src/app/admin/promotions/page.tsx src/__tests__/promotionStats.test.ts
git commit -m "feat: add promotion usage analytics"
```

---

### Task 17: Analytics expansion (LTV, retention, AOV trend)

**Files:**
- Modify: `src/server/services/analytics.service.ts`
- Modify: `src/app/api/admin/analytics/route.ts`
- Modify: `src/app/admin/analytics/page.tsx`
- Test: `src/__tests__/analyticsCalculations.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { calculateLtv } from '@/server/services/analytics.service';

it('calculates LTV as total revenue / unique users', () => {
  expect(calculateLtv(2000, 100)).toBe(20);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/analyticsCalculations.test.ts`
Expected: FAIL (helper missing)

**Step 3: Write minimal implementation**

```ts
export function calculateLtv(totalRevenue: number, userCount: number) {
  if (!userCount) return 0;
  return Math.round((totalRevenue / userCount) * 100) / 100;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/analyticsCalculations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/services/analytics.service.ts src/app/api/admin/analytics/route.ts src/app/admin/analytics/page.tsx src/__tests__/analyticsCalculations.test.ts
git commit -m "feat: expand analytics calculations"
```

---

## Documentation & Changelog

### Task 18: Update docs + changelog

**Files:**
- Modify: `docs/core/api_spec.md`
- Modify: `docs/core/erd.md`
- Modify: `docs/core/components.md`
- Create: `docs/changelogs/2026-01/change_log_2026-01-23_phase-optimizations.md`

**Step 1: Write the failing test**

```text
No automated test. Use manual checklist in Step 4.
```

**Step 2: Run test to verify it fails**

Run: N/A
Expected: N/A

**Step 3: Write minimal implementation**

```md
# Change Log — 2026-01-23

## Summary
Phased optimizations: first-order packages, renewal discounts, order status logs, and analytics alignment.
```

**Step 4: Run test to verify it passes**

Manual checklist:
- New API endpoints documented
- ERD reflects schema changes
- UI component changes described

**Step 5: Commit**

```bash
git add docs/core/api_spec.md docs/core/erd.md docs/core/components.md docs/changelogs/2026-01/change_log_2026-01-23_phase-optimizations.md
git commit -m "docs: update specs and changelog for phased optimizations"
```
