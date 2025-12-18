# Change Log — 2025-12-18

## Summary
Fixed “我的优惠券” console errors caused by missing legacy endpoint `GET /api/vouchers/my`.

## Changes
- Added backward-compatible API route: `src/app/api/vouchers/my/route.ts`
  - Implements `GET /api/vouchers/my` and returns the same voucher payload as `GET /api/user/vouchers`.
  - Prevents 404 responses (HTML) that cause `not valid JSON` in older/cached clients.

## Tests
- Manual: open “我的优惠券” → verify no `GET /api/vouchers/my 404` in console and vouchers load successfully.

