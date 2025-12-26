# Change Log — 2025-12-27

## Summary
Stabilized API migration by fixing client service regressions and hardening voucher stats parsing.

## Changes
- Fixed duplicate `apiRequest` import in `src/services/reviewService.ts` to unblock Next.js build.
- Guarded voucher stats parsing when `/api/vouchers/stats` returns empty payload in `src/services/voucherService.ts`.
- Updated logout flow to use NextAuth `signOut` instead of a missing `/api/auth/logout` endpoint in `src/services/profileService.ts`.
- Required review comments to be at least 10 characters in `src/components/ReviewForm.tsx` and surfaced API errors in `src/services/reviewService.ts`.
- Fixed My Reviews list loading by allowing `getUserReviews()` without a userId and removing the empty-string call in `src/features/reviews/MyReviewsPage.tsx`.
- Aligned low-stock calculations with per-item `minimumStock` thresholds in `src/server/services/stats.service.ts` and `src/services/inventoryService.ts`, and enhanced low-stock alerts in `src/components/admin/LowStockAlert.tsx`.
- Improved admin reports chart readability and card layout in `src/components/admin/AdminReportsPage.tsx`.

## Tests
- Not run (UI regression fixes only). Recommended: `npm run dev` and verify profile logout + vouchers stats + packages center.
