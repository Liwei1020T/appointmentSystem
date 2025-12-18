# Change Log — 2025-12-18

## Summary
Prevented repeated `400 /api/vouchers/redeem-with-points` errors by hiding vouchers the user already owns from the Points Center redeem list.

## Changes
- Updated `src/app/api/vouchers/redeemable/route.ts`:
  - Exclude vouchers whose IDs exist in `user_vouchers` for the current user.
  - This avoids showing already-claimed vouchers and reduces noisy “您已领取过此优惠券” errors.

## Tests
- Manual: redeem a voucher → refresh “积分中心” → voucher no longer appears in redeem list; no repeated 400 requests when clicking.

