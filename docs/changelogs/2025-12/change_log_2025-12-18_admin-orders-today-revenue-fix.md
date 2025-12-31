# Change Log — 2025-12-18

## Summary
Fixed Admin “今日营业额” showing `RM 0.00` even when there are orders today.

## Changes
- Updated `src/app/api/admin/orders/stats/route.ts`:
  - Compute `todayTotal` using today’s `[00:00, now]` range.
  - Compute `todayRevenue` by summing `orders.price` for today and excluding `cancelled` orders.
  - Keep `revenue` as the sum of `completed` orders (optionally date-filtered by query params).

## Tests
- Manual: create an order today (pending/confirmed) → open Admin Orders → verify “今日订单” increments and “今日营业额” reflects the order amount.

