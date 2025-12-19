# Change Log — 2025-12-18

## Summary
Fixed Admin “用户管理” page showing 0 users and failing to load stats due to missing `/api/admin/users/stats` and mismatched API response parsing.

## Changes
- Added API: `GET /api/admin/users/stats`
  - File: `src/app/api/admin/users/stats/route.ts`
  - Provides user/order/revenue/points aggregates for admin dashboard cards.
- Updated API: `GET /api/admin/users`
  - File: `src/app/api/admin/users/route.ts`
  - Supports `role`, `status`, and `limit` (plus legacy `pageSize`) query params.
  - Includes `referredBy` in selection for UI display.
- Updated client service: `src/services/adminUserService.ts`
  - Correctly unwraps `{ success, data }` response format.
  - Normalizes camelCase fields into legacy snake_case aliases used by UI (`full_name`, `referral_code`, `created_at`, etc.).

## Tests
- Manual: open `/admin/users` → verify stats cards load (no 404) and user list shows records.

