# Change Log — 2025-12-17

## Summary
Added the missing points-based voucher redemption endpoint so users can redeem vouchers from the exchange flow.

## Changes
- Implemented `POST /api/vouchers/redeem-with-points` to validate voucher status, deduct points, create points logs, and issue user vouchers in `src/app/api/vouchers/redeem-with-points/route.ts`.
- Normalized the redeem response parsing in `src/services/voucher.service.ts` to read nested `data.userVoucher`.
- Documented the new endpoint in `docs/api_spec.md`.

## Tests
- Not run (recommend: redeem a points voucher, confirm user vouchers list updates and points balance decreases).
