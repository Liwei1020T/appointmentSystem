# Change Log — 2025-12-18

## Summary
Changed order-completion points to 50% of the order total amount and made the rule visible to users.

## Changes
- Updated `src/app/api/orders/[id]/complete/route.ts`:
  - Points formula: `points = floor(order_total_amount * 0.5)`.
  - Order total prefers latest `payments.amount`, falls back to `orders.price`.
  - Points log description and notification message now include the amount and “50%” rule for transparency.

## Tests
- Manual: complete an order with total RM 38.00 → verify points granted is 19, points log shows the calculation, and user notification mentions “获得 19 积分（50%）”.

