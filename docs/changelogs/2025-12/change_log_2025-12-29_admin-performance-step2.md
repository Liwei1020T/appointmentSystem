# Change Log — 2025-12-29

## Summary
Added short-lived request caching/dedup with tuned TTLs, added refresh bypass for admin dashboard/payments, and lazy-loaded heavier admin routes to reduce initial JS and redundant fetches.

## Changes
- Added `cachedRequest` utility with prefix invalidation to dedupe admin list requests.
- Wrapped admin list service fetches (orders, users, packages, vouchers, inventory, payments, dashboard stats) with cached requests and invalidated caches on mutations.
- Tuned cache TTLs per admin endpoint (lists vs stats vs sales data).
- Added refresh bypass for pending payments and dashboard data on manual reload.
- Lazy-loaded admin reports, notifications, payments, and reviews routes with `PageLoading` fallback.

## Tests
- Not run (not requested).
