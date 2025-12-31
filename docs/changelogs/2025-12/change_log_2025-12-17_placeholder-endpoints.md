# Change Log — 2025-12-17

## Summary
Removed remaining placeholder endpoints by wiring them to live Prisma data.

## Changes
- Implemented voucher stats for users (`/api/vouchers/stats`) and admin voucher stats (`/api/admin/vouchers/stats`).
- Implemented voucher distribution logic (`/api/admin/vouchers/{id}/distribute`).
- Implemented package sales analytics (`/api/admin/packages/sales`) and enhanced package stats (`/api/admin/packages/stats`).
- Implemented featured reviews API (`/api/reviews/featured`).
- Implemented admin report summary (`/api/admin/reports`).
- Updated `docs/api_spec.md` to remove placeholder section and list implemented endpoints.

## Tests
- Not run (recommend: open admin vouchers, packages, and reports pages; load home featured reviews).
