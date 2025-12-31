# Change Log — 2025-12-31

## Summary
Removed the fixed points-per-order configuration and unified environment configuration into a single `.env` file.

## Changes
- Removed `POINTS_PER_ORDER` from `.env` and `.env.example`.
- Removed `points_per_order` seed entries from `prisma/seed.ts` and `prisma/seed.sql`.
- Updated `sql/full_schema.sql` to drop the `points_per_order` system setting and calculate order reward points as 50% of `final_price`.
- Updated `docs/erd.md` system settings examples to reflect the removal.
- Set `PAYMENT_TIMEOUT_MINUTES=30` in `.env` and removed `.env.local`.
- Updated setup docs and `start.ps1` to reference `.env` instead of `.env.local`.

## Tests
- Not run (not requested).
