# Change Log — 2025-12-18

## Summary
Fixed an issue where cash payment was incorrectly displayed as "Touch 'n Go" and improved payment record handling.

## Changes
- **API Updates**:
  - Updated `POST /api/orders/create` to use `provider: 'cash'` instead of `manual` for initial payment records.
  - Updated `POST /api/packages/buy` to use `provider: 'cash'` instead of `manual`.
  - Updated `POST /api/payments/cash` to set payment status to `pending_verification` for better user feedback.
- **UI Updates**:
  - Updated `OrderDetailPage.tsx` to sort payment records by creation date (descending), ensuring the latest payment attempt is displayed.
  - Fixed provider mapping in `OrderDetailPage.tsx` to correctly identify both `cash` and `manual` as "现金支付".
  - Improved status display logic in `OrderDetailPage.tsx` to handle `pending_verification` status.
  - Updated `AdminOrderDetailPage.tsx` to correctly display `manual` provider as "现金支付".

## Tests
- Verified that new orders now have `cash` as the default provider instead of `manual`.
- Verified that selecting cash payment now correctly shows "现金支付" and "待审核" status in the order details.
- Verified that if multiple payment attempts exist, the latest one is shown.
