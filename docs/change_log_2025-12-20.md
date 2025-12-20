# Change Log — 2025-12-20

## Summary
System architecture optimization: service layer consolidation, API route cleanup, and dead code removal.

## Changes

### Service Layer Consolidation
- Merged 10 duplicate service pairs to `*Service.ts` naming convention:
  - `profile.service.ts` → `profileService.ts`
  - `auth.service.ts` → `authService.ts`
  - `inventory.service.ts` → `inventoryService.ts`
  - `notification.service.ts` → `notificationService.ts`
  - `package.service.ts` → `packageService.ts`
  - `payment.service.ts` → `paymentService.ts`
  - `points.service.ts` → `pointsService.ts`
  - `voucher.service.ts` → `voucherService.ts`
  - `order.service.ts` → `orderService.ts`
  - `review.service.ts` → `reviewService.ts`

### API Route Cleanup
- Moved `api/payment/tng/callback` → `api/payments/tng/callback`
- Updated `tngPaymentService.ts` API paths
- Deleted redundant `api/payment/` directory

### Dead Code Cleanup
- Deleted `admin.service.ts` (unused, old naming)
- Deleted empty `contexts/` directory
- Fixed `AdminInventoryDetailPage.tsx` inventory.service import

### Bug Fixes
- Fixed duplicate order display on home page (RecentOrders rendered twice)
- Fixed missing date display in RecentOrders (createdAt field fallback)
- Added missing notification utility functions (getNotificationIcon, getNotificationColor, formatNotificationTime)
- Fixed PaymentVerificationPage import

## Files Changed

### Deleted
- `src/services/admin.service.ts`
- `src/services/profile.service.ts`
- `src/services/auth.service.ts`
- `src/services/inventory.service.ts`
- `src/services/notification.service.ts`
- `src/services/package.service.ts`
- `src/services/payment.service.ts`
- `src/services/points.service.ts`
- `src/services/voucher.service.ts`
- `src/services/order.service.ts`
- `src/services/review.service.ts`
- `src/app/api/payment/` directory
- `src/contexts/` directory

### Modified
- Multiple component files to update service imports
- `src/services/notificationService.ts` (added utility functions)
- `src/features/home/HomePage.tsx` (removed duplicate RecentOrders)
- `src/features/home/RecentOrders.tsx` (fixed date field access)

## Tests
- Dev server verified working (Ready in 2.8-4.6s)
- All imports resolved correctly
- No module-not-found errors

## Notes
- TypeScript has ~6 pre-existing TS7006 (implicit any) warnings in admin components - these are not new issues
- Testing infrastructure recommended for future iteration
