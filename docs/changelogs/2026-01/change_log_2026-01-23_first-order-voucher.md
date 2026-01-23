# Change Log — 2026-01-23

## Summary
Added admin-configurable first-order auto-issue voucher flags and enforced eligibility during order creation.

## Changes
- Added first-order voucher eligibility guard and applied it across order creation flows.
- Normalized admin voucher payloads to include auto-issue, first-order-only, and post-issue validity fields.
- Updated admin voucher list/detail UI to edit and surface auto-issue and first-order-only flags.
- Extended admin vouchers API to accept the new voucher fields.
- Documented voucher flags in API spec and ERD.

## Tests
- `npx vitest --config vitest.worktree.config.ts src/__tests__/firstOrderVoucherEligibility.test.ts`
- `npx vitest --config vitest.worktree.config.ts src/__tests__/firstOrderVoucherOrderGuard.test.ts`
- `npx vitest --config vitest.worktree.config.ts src/__tests__/adminVoucherNormalize.test.ts`
- `npx vitest --config vitest.worktree.config.ts src/__tests__/AdminVoucherBadges.test.tsx`
