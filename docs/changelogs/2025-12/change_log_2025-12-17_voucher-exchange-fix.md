# Change Log — 2025-12-17

## Summary
Fixed voucher exchange page crash by normalizing redeemable voucher responses and guarding array usage.

## Changes
- Normalized `/api/vouchers/redeemable` response parsing to accept both `{ data: [] }` and `{ data: { vouchers: [] } }` in `src/services/voucher.service.ts`.
- Added array guards before setting and mapping `vouchers` in `src/features/vouchers/VoucherExchangePage.tsx`.

## Tests
- Not run (recommend opening the voucher exchange page and confirming it no longer crashes).
