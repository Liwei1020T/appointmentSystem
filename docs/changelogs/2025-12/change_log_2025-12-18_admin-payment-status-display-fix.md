# Change Log — 2025-12-18

## Summary
Fixed Admin Order Detail page showing “待确认” even after payment has been confirmed.

## Changes
- Updated `src/components/admin/AdminOrderDetailPage.tsx`:
  - Treat `payments.status = 'success'` as a confirmed/paid state (in addition to legacy `'completed'`).
  - Show the cash “待确认提示” only when payment is not confirmed.

## Tests
- Manual: confirm a cash/TNG payment → refresh order detail → verify payment status badge shows “已支付”.

