# Change Log — 2025-12-20

## Summary
Migrated orders and payments (including admin order/payment management) to Server Actions and removed legacy API routes.

## Changes
- Added Server Actions for user orders, admin orders, and payment flows (pending list, confirm/reject, cash confirm).
- Updated order, payment, admin-order, review, and booking flows to call Server Actions.
- Removed legacy API routes for orders, payments, admin orders, and admin payments.
- Updated API spec note to reflect the migration scope.

## Tests
- Manual UI check: create order from booking flow.
- Manual UI check: order detail, cancel order, and admin order status update.
- Manual UI check: payment creation, cash payment flow, and admin payment confirmation.
