# Change Log — 2025-12-18

## Summary
Removed remaining “placeholder endpoints” from `docs/api_spec.md` by implementing real voucher stats + voucher distribution APIs and aligning admin services to unwrap `{ success, data }`.

## Changes
- Implemented user voucher stats:
  - `GET /api/vouchers/stats` now returns real counts for current user (total/active/used/expired/usageRate).
- Implemented admin voucher stats:
  - `GET /api/admin/vouchers/stats` now returns real counts (vouchers total/active/expired + distributed/used + usage_rate + total_discount_given).
- Implemented admin voucher distribution:
  - `POST /api/admin/vouchers/:id/distribute` now creates `user_vouchers` records, skips duplicates, respects `max_uses`, and increments `vouchers.used_count` for issued vouchers.
- Fixed admin voucher service response handling:
  - `src/services/adminVoucherService.ts` now unwraps `{ success, data }` for stats/user-vouchers/distribution results.

## Docs
- Updated `docs/api_spec.md`:
  - Local Placeholder Endpoints section now notes there are no remaining placeholder endpoints.
  - Added voucher stats/distribution endpoints to Local Implemented Endpoints list.

## Tests
- Manual smoke test:
  - User: open “我的优惠券” → stats cards should match owned vouchers.
  - Admin: open `/admin/vouchers` → stats cards should show real totals (non-zero with data).
  - Admin: distribute a voucher (all/specific) → modal should show returned count; database should have new `user_vouchers` rows.

