# Change Log — 2025-12-26

## Summary
Extended the API migration with order + order photo route handlers and completed Server Actions removal for profile, points, vouchers, referrals, reviews, notifications, and admin orders/stats.

## Changes
- Added `zod` for request validation.
- Added shared admin role helper (`admin` + `super_admin`) and wired it into server auth and UI guards.
- Secured admin stats endpoints with `requireAdmin()` and forced dynamic responses.
- Added API error primitives and JSON validation helper for Route Handlers.
- Added `POST /api/payments/:id/verify` Route Handler (admin-only), supporting cash and non-cash confirmations.
- Added payment Route Handlers for create, cash create, receipt update, reject, get-by-id, and admin pending list.
- Moved payment business logic into `src/server/services/payment.service.ts` and switched `paymentService` to API fetch.
- Added shared API fetch helper for `{ ok }` responses in `src/services/apiClient.ts`.
- Gated TNG callback endpoint behind `TNG_CALLBACK_ENABLED` feature flag with TODO for signature/idempotency.
- Documented `TNG_CALLBACK_ENABLED` in `.env.example`.
- Added order Route Handlers (`/api/orders`, `/api/orders/create`, `/api/orders/:id`, `/api/orders/:id/cancel`, `/api/orders/:id/complete`) using zod validation + service layer.
- Added order photo APIs (`/api/orders/:id/photos`, `/api/orders/:id/photos/:photoId`, `/api/orders/:id/photos/reorder`) with owner/admin access checks.
- Moved order photo persistence to `src/server/services/order-photos.service.ts` with JSON notes parsing and admin safeguards.
- Updated booking flows and order services to call API routes instead of server actions.
- Removed `src/actions/orders.actions.ts` and `src/actions/orderPhotos.actions.ts` after replacing usages.
- Added service-layer modules for points, vouchers, profile, referrals, reviews, notifications, admin orders, and stats.
- Added Route Handlers for points (`/api/points`, `/api/points/history`, `/api/points/stats`, `/api/points/redeem`) with zod validation.
- Added voucher APIs (`/api/vouchers/user`, `/api/vouchers/redeem`, `/api/vouchers/redeemable`, `/api/vouchers/redeem-with-points`, `/api/vouchers/stats`) with unified `{ ok }` responses.
- Added profile + referral APIs (`/api/profile`, `/api/profile/password`, `/api/profile/referral-code`, `/api/referrals`, `/api/referrals/my-stats`, `/api/referrals/leaderboard`).
- Added review APIs (`/api/reviews`, `/api/reviews/user`, `/api/reviews/order/:orderId`, `/api/reviews/pending`, `/api/admin/reviews`, `/api/admin/reviews/stats`, `/api/admin/reviews/:id/reply`) and refactored featured reviews to use the service layer.
- Added notification APIs (`/api/notifications`, `DELETE /api/notifications/:id`) and updated client services to use fetch APIs.
- Added admin order APIs (`/api/admin/orders/:id`, `/api/admin/orders/:id/status`, `/api/admin/orders/stats`) and updated admin order service calls to fetch APIs.
- Removed remaining Server Action files under `src/actions/*`.
- Updated `docs/api_spec.md` with the new Route Handler endpoints.
- Added admin package service + Route Handlers for package detail, status toggle, and purchase history.
- Added admin dashboard stats client service and replaced direct fetch usage in admin dashboard + voucher distribution + restock modal.
- Unified legacy API helpers to return `{ ok }` responses and standard `{ error: { code, message } }` payloads.
- Updated auth/admin/report/voucher/user services to normalize error messages against the unified API format.
- Updated TNG payment status lookup to use `/api/payments/:id` (no external TNG service dependency).

## Tests
- Not run (manual verification pending).
