# Change Log — 2025-12-18

## Summary
Fixed Points Center “立即兑换” causing repeated `400 (Bad Request)` due to calling the wrong redeem endpoint.

## Changes
- Updated `src/features/profile/PointsCenterPage.tsx`:
  - Redeem action now calls `POST /api/vouchers/redeem-with-points` with `{ voucherId }` instead of `POST /api/vouchers/redeem` (which requires a `code`).

## Tests
- Manual: open “积分中心” → click “立即兑换” → verify no 400 errors in console and voucher is redeemed successfully (or shows “积分不足/您已领取过此优惠券” when applicable).

