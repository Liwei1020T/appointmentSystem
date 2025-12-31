# Change Log — 2025-12-18

## Summary
Fixed Admin User Detail page failing with 404/“not valid JSON” by implementing missing user detail APIs and aligning client parsing.

## Changes
- Added APIs:
  - `GET /api/admin/users/{id}` + `PUT /api/admin/users/{id}` (`src/app/api/admin/users/[id]/route.ts`)
  - `GET /api/admin/users/{id}/orders` (`src/app/api/admin/users/[id]/orders/route.ts`)
  - `GET /api/admin/users/{id}/packages` (`src/app/api/admin/users/[id]/packages/route.ts`)
  - `GET /api/admin/users/{id}/vouchers` (`src/app/api/admin/users/[id]/vouchers/route.ts`)
  - `GET /api/admin/users/{id}/points-log` (`src/app/api/admin/users/[id]/points-log/route.ts`)
  - `PUT /api/admin/users/{id}/block` placeholder (`src/app/api/admin/users/[id]/block/route.ts`) to avoid 404; returns a clear error because DB lacks `is_blocked`.
- Updated existing APIs for compatibility:
  - `src/app/api/admin/users/[id]/role/route.ts`: accepts `PUT` (alias) and maps `user` → `customer`.
  - `src/app/api/admin/users/[id]/points/route.ts`: accepts `PUT` and supports `{ points, reason, type }` as well as legacy `{ amount, reason }`.
- Updated client parsing:
  - `src/services/adminUserService.ts`: unwraps `{ success, data }` and reads nested payloads for user detail/orders/packages/vouchers/points-log/points/role/block requests.

## Tests
- Manual: open `/admin/users/{id}` → verify page loads user info + orders/packages/vouchers/points-log without 404/JSON errors.

