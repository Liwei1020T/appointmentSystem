# Change Log — 2025-12-17

## Summary
Made user vouchers visible by implementing real user voucher and redeemable voucher endpoints backed by Prisma.

## Changes
- Implemented `/api/user/vouchers` to return the current user's vouchers with UI-ready fields in `src/app/api/user/vouchers/route.ts`.
- Implemented `/api/vouchers/redeemable` to list active vouchers within the valid date window in `src/app/api/vouchers/redeemable/route.ts`.
- Hardened the user vouchers page to accept wrapped API responses and fallback field names in `src/features/vouchers/MyVouchersPage.tsx`.
- Documented the implemented endpoints in `docs/api_spec.md`.

## Tests
- Not run (recommend: open "我的优惠券" and "兑换优惠券" and verify admin-created vouchers appear and can be redeemed/filtered).
