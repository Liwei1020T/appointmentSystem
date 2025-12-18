# Change Log — 2025-12-18

## Summary
Fixed duplicate “确认收款” button on Admin Order Detail page when payment provider is TNG with receipt verification flow.

## Changes
- Updated `src/components/admin/AdminOrderDetailPage.tsx`:
  - Hide the generic “确认收款” button when `payment.provider === 'tng'` and `payment.receipt_url` exists, so only the dedicated “确认TNG收款” button is shown.

## Tests
- Manual: open an order with TNG pending + receipt → confirm only one confirm button appears; open cash pending → confirm button appears once.

