# Change Log — 2025-12-18

## Summary
Fixed Points Center showing 0 points after completing an order (data was awarded but UI parsed the wrong API response shape/endpoints).

## Changes
- Updated `src/features/profile/PointsCenterPage.tsx`:
  - Unwrap `{ success, data }` responses for `/api/points` and `/api/points/history`.
  - Read `balance` instead of non-existent `points`.
  - Map Prisma `points_logs` rows (`amount`, `type`, `createdAt`) into the UI's `earned/spent` display model.
  - Fetch redeemable vouchers from the correct endpoint: `GET /api/vouchers/redeemable`.

## Tests
- Manual: complete an order → open “积分中心” → verify current points increases and a new “订单完成” log appears.

