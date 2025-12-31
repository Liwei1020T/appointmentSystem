# Change Log — 2025-12-16

## Summary
Fixed admin voucher creation by aligning the UI, service, and API contracts (required fields, payload mapping, and validation).

## Changes
- Added voucher name input, stricter required checks, and backend-aligned payload mapping in `src/components/admin/AdminVoucherListPage.tsx`.
- Normalized admin voucher service responses and error handling to use the `/api/admin/vouchers` contract.
- Expanded `/api/admin/vouchers` API to validate camel/snake case fields, support full updates, single-voucher lookup, and safe deletion with distribution guard.
- Fixed admin navbar user-menu hover gap by anchoring the dropdown to `top-full` with hover/focus-visible pointer events in `src/components/layout/Navbar.tsx`, preventing the menu from disappearing when moving the cursor.
- Added `description` column back to `string_inventory` (schema + migration `sql/migrations/011_add_string_inventory_description.sql`) to fix Prisma runtime errors on inventory queries.
- Added `reviews` table (schema + migration `sql/migrations/012_add_reviews_table.sql`) so the database matches the Prisma `Review` model.
- Added an explicit “确认收款” action for pending payments on order detail (`src/components/admin/AdminOrderDetailPage.tsx`), supporting cash and other providers via existing admin payment APIs.
- Removed the “开始穿线/处理中” quick action button from order detail header, leaving status changes to the status modal or completion flow (`src/components/admin/AdminOrderDetailPage.tsx`).
- Prevented infinite photo reloads by stabilizing the OrderPhotosUpload existing-photos effect dependency (`src/components/OrderPhotosUpload.tsx`).
- Redesigned user-facing payment info card with richer status, provider details, and timestamps in `src/features/orders/OrderDetailPage.tsx` (review CTA already present for completed orders).
- Payment info now constrains providers to TNG or cash and shows completed once admin-verified or order finished (`src/features/orders/OrderDetailPage.tsx`).
- Fixed payment provider display to honor cash selection (falls back only when provider missing), so cash payments no longer show Touch 'n Go (`src/features/orders/OrderDetailPage.tsx`).
- Removed refund records panel from admin order detail (`src/components/admin/AdminOrderDetailPage.tsx`).
- Fixed admin order detail tension display to fall back to stored tension value when per-axis values are missing (`src/components/admin/AdminOrderDetailPage.tsx`).
- Added empty-body guards to admin package create/update APIs to avoid JSON parse errors on missing body (`src/app/api/admin/packages/route.ts`).
- Implemented admin package GET listing plus stats/sales endpoints to stop 404/405 errors (`src/app/api/admin/packages/route.ts`, `src/app/api/admin/packages/stats/route.ts`, `src/app/api/admin/packages/sales/route.ts`).
- Hardened admin user list to handle non-array responses safely (prevents `users.map` runtime error) in `src/components/admin/AdminUserListPage.tsx`.
- Added stub admin reports endpoints (summary/revenue/profit/sales/top-strings/top-packages/user-growth/order-trends/export) to return JSON/CSV placeholders instead of 404/HTML, preventing report page crashes (`src/app/api/admin/reports/*`).
- Added voucher stats endpoint placeholder to avoid 404/JSON parse errors on admin voucher dashboard (`src/app/api/admin/vouchers/stats/route.ts`).
- Added admin user-vouchers endpoint to fix user voucher fetch (404/HTML issues) on voucher detail page (`src/app/api/admin/vouchers/user/[userId]/route.ts`).
- Added admin voucher distribute endpoint stub to stop 404/JSON errors when distributing vouchers (`src/app/api/admin/vouchers/[id]/distribute/route.ts`).
- Added review submission and user/featured review stub APIs to eliminate 404/JSON errors on review actions (`src/app/api/reviews/route.ts`, `src/app/api/reviews/user/route.ts`, `src/app/api/reviews/featured/route.ts`); removed front-end console logs and kept UI cleaner (`src/features/orders/OrderDetailPage.tsx`, `src/components/OrderPaymentSection.tsx`, `src/components/OrderPhotosDisplay.tsx`, `src/components/admin/AdminOrderDetailPage.tsx`, `src/services/realtimeService.ts`).
- Order detail review CTA now immediately swaps to the submitted review card after success (no full reload required) (`src/features/orders/OrderDetailPage.tsx`, `src/components/ReviewForm.tsx`, `src/services/review.service.ts`).
- Added user voucher list stub endpoint to prevent 404s on `/api/user/vouchers` (`src/app/api/user/vouchers/route.ts`).
- Added user-facing voucher stats and redeemable voucher placeholders to prevent 404/JSON errors on voucher pages (`src/app/api/vouchers/stats/route.ts`, `src/app/api/vouchers/redeemable/route.ts`).

## Tests
- Not run (recommend UI create/edit/delete smoke test in the admin voucher modal).
