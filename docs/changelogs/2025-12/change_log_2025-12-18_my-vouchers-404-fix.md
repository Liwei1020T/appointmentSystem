# Change Log — 2025-12-18

## Summary
Fixed “我的优惠券” page failing to load vouchers due to calling a missing endpoint (`/api/vouchers/my`).

## Changes
- Updated `src/features/profile/MyVouchersPage.tsx`:
  - Fetch vouchers from implemented API `GET /api/user/vouchers` (unwrap `{ success, data }`).
  - Map backend status `active` to UI “可用”.
  - Use `expires_at/expiry` for expiry display and allow “立即使用” for `active` vouchers.

## Tests
- Manual: open “我的优惠券” page → verify no 404/JSON errors in console and vouchers list renders correctly.

