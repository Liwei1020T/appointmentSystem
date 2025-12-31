# Change Log — 2025-12-18

## Summary
Fixed Admin Order Detail “支付方式” becoming blank/`-` after confirming payment.

## Changes
- Updated `src/components/admin/AdminOrderDetailPage.tsx`:
  - Select the most relevant payment from `order.payments` by sorting (latest first) instead of always using `payments[0]`.
  - Display fallback `payment.provider` when `payment_method/method` are missing.

## Tests
- Manual: open an order with cash/TNG payment → confirm payment → verify “支付方式”仍显示“现金支付/TNG”等信息且不为空。

