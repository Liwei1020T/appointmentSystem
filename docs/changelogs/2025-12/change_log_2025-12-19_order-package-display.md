# Change Log — 2025-12-19

## Summary
Clarified the order-detail experience for package-paid bookings and introduced membership tiers/discounts based on total spend _without_ adding extra persisted columns, keeping APIs stable while still presenting tier progress and discounts to users.

## Changes
- `src/features/orders/OrderDetailPage.tsx`: Show a richer "套餐支付" card, surface the package name/expiry/remaining counts, and explain why the final amount is zero when a package was used.
- `src/types/database.ts`: Expose the `packageUsed` relation on the shared `Order` type so downstream components can safely read the package metadata.
- `docs/api_spec.md`: Document the `GET /api/orders/{id}` response and highlight the `packageUsed` payload, plus shift the payment API numbering for consistency.
- `src/components/admin/DistributeVoucherModal.tsx`: Parse the admin user API payload correctly so the specific-user flow always deals with an array and renders the list reliably.
 - `src/lib/membership.ts`: Define the membership tier thresholds (RM 300/500/700/1000) and helper utilities for labels, progress, and discounts.
 - `src/app/api/user/stats/route.ts` & `src/services/profileService.ts`: Derive total spend from orders, compute the membership tier information, and expose it to the UI without touching the `users` table.
 - `src/features/profile/ProfilePage.tsx` & `src/features/booking/BookingFlow.tsx`: Surface membership progress on the profile, show discount messaging, and apply the tier discount to booking prices.
 - `docs/api_spec.md`: Document the new `GET /api/user/stats` response so the membership progression contract is explicit.

## Tests
- `npm run type-check`
