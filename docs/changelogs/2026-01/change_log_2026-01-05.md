# Change Log — 2026-01-05

## Summary
System optimization + correctness hardening: reduced middleware overhead, stabilized Next.js builds by forcing dynamic API routes, and fixed order cancellation/cron cleanup to properly release reserved resources.

## Changes

### Performance
- **Optimized** `src/middleware.ts`: Skip JWT token lookup for public routes; only evaluate session for auth/protected/admin paths.
- **Stabilized builds**: Added `export const dynamic = 'force-dynamic'` to auth/admin/payment/upload API route handlers to prevent Next.js from attempting static rendering during `next build`.

### Business Logic / Correctness
- **Fixed** `src/app/api/cron/cleanup-orders/route.ts`: Cron cleanup now cancels pending payments, restores used vouchers/packages, releases reserved inventory based on `stock_logs`, and writes return logs.
- **Fixed** `src/server/services/order.service.ts`: User order cancellation now restores used vouchers and reserved inventory (with return logs) and uses an atomic status transition.
- **Aligned** stock logging: `createOrder` and `createMultiRacketOrder` now log `INVENTORY.DEDUCT_ON_CREATE` consistently.

### UI / DX
- **Fixed** `src/components/admin/AdminOrderDetailPage.tsx`: Completion toast now reads camelCase fields returned by the completion API (`stockDeducted`, `pointsGranted`).
- **Refactor** `src/features/booking/components/StringCard.tsx`: Uses centralized `INVENTORY.LOW_STOCK_THRESHOLD`.

## Tests
- `npm run build`

## Impact
- Faster edge middleware on public pages.
- Cleaner/safer production builds (no “Dynamic server usage” noise from API route handlers).
- Prevents inventory/voucher leakage when orders are cancelled or auto-cancelled by cron.

