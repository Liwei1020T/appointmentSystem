# First-Order Auto-Issue Voucher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to configure auto-issued, first-order-only vouchers and enforce eligibility during order creation.

**Architecture:** Expose existing voucher flags (`isAutoIssue`, `isFirstOrderOnly`, `validityDays`) in admin API/UI. Signup continues to auto-issue vouchers flagged for auto distribution. Order creation enforces first-order eligibility via a shared helper before creating transactions. Documentation is updated to reflect the flags and validation behavior.

**Tech Stack:** Next.js App Router, Prisma, React, Tailwind CSS, Vitest.

---

### Task 1: First-order voucher eligibility helper

**Files:**
- Create: `src/__tests__/firstOrderVoucherEligibility.test.ts`
- Modify: `src/server/services/welcome.service.ts`

**Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { assertFirstOrderVoucherEligibility } from '@/server/services/welcome.service';

describe('assertFirstOrderVoucherEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows when voucher is not first-order-only', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    await expect(assertFirstOrderVoucherEligibility('user-1', false)).resolves.toBeUndefined();
  });

  it('allows when user has no prior orders', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await expect(assertFirstOrderVoucherEligibility('user-1', true)).resolves.toBeUndefined();
  });

  it('rejects when user already ordered', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    await expect(assertFirstOrderVoucherEligibility('user-1', true)).rejects.toThrow('首单');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/firstOrderVoucherEligibility.test.ts`  
Expected: FAIL with “assertFirstOrderVoucherEligibility is not a function”.

**Step 3: Write minimal implementation**

```ts
import { ApiError } from '@/lib/api-errors';

export async function assertFirstOrderVoucherEligibility(userId: string, isFirstOrderOnly: boolean) {
  if (!isFirstOrderOnly) return;
  const isFirstOrder = await isUserFirstOrder(userId);
  if (!isFirstOrder) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, '此优惠券仅限首单使用');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/firstOrderVoucherEligibility.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/firstOrderVoucherEligibility.test.ts src/server/services/welcome.service.ts
git commit -m "feat: add first-order voucher eligibility guard"
```

---

### Task 2: Enforce first-order vouchers in order creation

**Files:**
- Create: `src/__tests__/firstOrderVoucherOrderGuard.test.ts`
- Modify: `src/server/services/order.service.ts`

**Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn() },
    stringInventory: { findUnique: vi.fn() },
    userVoucher: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/server/services/order-eta.service', () => ({
  calculateEstimatedCompletion: vi.fn().mockResolvedValue(new Date()),
}));

import { prisma } from '@/lib/prisma';
import { createOrderWithPackage } from '@/server/services/order.service';

describe('createOrderWithPackage first-order voucher guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects first-order-only voucher for non-first user', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.stringInventory.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'string-1',
      stock: 10,
      costPrice: 10,
    });
    (prisma.userVoucher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'uv-1',
      userId: 'user-1',
      status: 'active',
      expiry: new Date(Date.now() + 86400000),
      voucher: {
        isFirstOrderOnly: true,
        type: 'fixed_amount',
        value: 5,
        minPurchase: 0,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000),
      },
    });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (fn: any) =>
      fn({
        order: { create: vi.fn().mockResolvedValue({ id: 'order-1' }) },
        userVoucher: { update: vi.fn() },
        payment: { create: vi.fn() },
        userPackage: { update: vi.fn() },
      })
    );

    await expect(
      createOrderWithPackage({ id: 'user-1', role: 'customer', fullName: 'Test' }, {
        stringId: 'string-1',
        tension: 24,
        voucherId: 'uv-1',
      })
    ).rejects.toThrow('首单');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/firstOrderVoucherOrderGuard.test.ts`  
Expected: FAIL because the order guard does not yet check first-order eligibility.

**Step 3: Write minimal implementation**

```ts
import { assertFirstOrderVoucherEligibility } from './welcome.service';

// After fetching voucher/voucherUsed:
await assertFirstOrderVoucherEligibility(user.id, !!voucher.isFirstOrderOnly);
```

Apply in:
- `createOrder` (when voucherId is present and userVoucher is found)
- `createOrderWithPackage` (after voucher lookup)
- `createMultiRacketOrder` (after voucher lookup)

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/firstOrderVoucherOrderGuard.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/firstOrderVoucherOrderGuard.test.ts src/server/services/order.service.ts
git commit -m "feat: enforce first-order voucher usage in order creation"
```

---

### Task 3: Admin voucher normalization for new flags

**Files:**
- Create: `src/__tests__/adminVoucherNormalize.test.ts`
- Modify: `src/services/adminVoucherService.ts`
- Modify: `src/types/database.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeVoucher } from '@/services/adminVoucherService';

describe('normalizeVoucher', () => {
  it('maps first-order and auto-issue flags', () => {
    const result = normalizeVoucher({
      id: 'v-1',
      code: 'WELCOME5',
      type: 'fixed_amount',
      value: 5,
      isAutoIssue: true,
      isFirstOrderOnly: true,
      validityDays: 7,
    });

    expect(result.isAutoIssue).toBe(true);
    expect(result.isFirstOrderOnly).toBe(true);
    expect(result.validityDays).toBe(7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/adminVoucherNormalize.test.ts`  
Expected: FAIL because `normalizeVoucher` is not exported or fields not mapped.

**Step 3: Write minimal implementation**

```ts
export function normalizeVoucher(raw: any): Voucher {
  const isAutoIssue = raw.isAutoIssue ?? raw.is_auto_issue ?? false;
  const isFirstOrderOnly = raw.isFirstOrderOnly ?? raw.is_first_order_only ?? false;
  const validityDays = raw.validityDays ?? raw.validity_days ?? null;

  return {
    ...raw,
    isAutoIssue,
    is_auto_issue: isAutoIssue,
    isFirstOrderOnly,
    is_first_order_only: isFirstOrderOnly,
    validityDays,
    validity_days: validityDays,
    // existing normalized fields...
  };
}
```

Also extend `Voucher` interfaces to include these fields.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/adminVoucherNormalize.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/adminVoucherNormalize.test.ts src/services/adminVoucherService.ts src/types/database.ts
git commit -m "feat: normalize admin voucher flags for auto-issue and first-order"
```

---

### Task 4: Admin voucher UI for auto-issue + first-order flags

**Files:**
- Create: `src/__tests__/AdminVoucherBadges.test.tsx`
- Modify: `src/components/admin/AdminVoucherListPage.tsx`
- Modify: `src/components/admin/AdminVoucherDetailPage.tsx`
- Modify: `src/app/api/admin/vouchers/route.ts`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminVoucherListPage from '@/components/admin/AdminVoucherListPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/services/adminVoucherService', () => ({
  getAllVouchers: vi.fn().mockResolvedValue({
    vouchers: [
      { id: 'v-1', code: 'WELCOME5', type: 'fixed_amount', value: 5, active: true, isAutoIssue: true, isFirstOrderOnly: true },
    ],
    error: null,
  }),
  getVoucherStats: vi.fn().mockResolvedValue({ stats: null }),
  createVoucher: vi.fn(),
  updateVoucher: vi.fn(),
  deleteVoucher: vi.fn(),
  toggleVoucherStatus: vi.fn(),
}));

describe('AdminVoucherListPage badges', () => {
  it('shows auto-issue and first-order badges', async () => {
    render(<AdminVoucherListPage />);
    expect(await screen.findByText('自动发放')).toBeInTheDocument();
    expect(await screen.findByText('首单专属')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/AdminVoucherBadges.test.tsx`  
Expected: FAIL because badges are not rendered yet.

**Step 3: Write minimal implementation**

- Add form fields:
  - `validity_days` (number input, optional)
  - `is_auto_issue` (checkbox)
  - `is_first_order_only` (checkbox)
- Include these in `createVoucher` / `updateVoucher` payloads as `validityDays`, `isAutoIssue`, `isFirstOrderOnly`.
- Render badge group in list cards and detail header when flags are true.
- Update `/api/admin/vouchers` POST/PATCH to accept/store `isAutoIssue`, `isFirstOrderOnly`, `validityDays` (and snake_case aliases).

**Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/AdminVoucherBadges.test.tsx`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/AdminVoucherBadges.test.tsx src/components/admin/AdminVoucherListPage.tsx src/components/admin/AdminVoucherDetailPage.tsx src/app/api/admin/vouchers/route.ts
git commit -m "feat: expose auto-issue and first-order voucher flags in admin UI"
```

---

### Task 5: Documentation + changelog

**Files:**
- Modify: `docs/core/api_spec.md`
- Modify: `docs/core/erd.md`
- Create: `docs/changelogs/2026-01/change_log_2026-01-23_first-order-voucher.md`

**Step 1: Update docs**
- `api_spec.md`: add `isAutoIssue`, `isFirstOrderOnly`, `validityDays` fields to admin voucher endpoints.
- `erd.md`: add `is_auto_issue`, `is_first_order_only`, `validity_days` columns to `vouchers` table.
- Changelog: summarize new voucher flags, order enforcement, and tests.

**Step 2: Commit**

```bash
git add docs/core/api_spec.md docs/core/erd.md docs/changelogs/2026-01/change_log_2026-01-23_first-order-voucher.md
git commit -m "docs: document first-order auto-issue vouchers"
```

