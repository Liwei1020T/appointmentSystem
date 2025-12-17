# Change Log — 2025-12-17

## Summary
Removed the refund feature across user and admin surfaces, and aligned voucher stats UI with the API response.

## Changes
- Removed refund UI components and references in order detail and admin order pages (`src/features/orders/OrderDetailPage.tsx`, `src/components/admin/AdminOrderDetailPage.tsx`, `src/components/admin/AdminOrderListPage.tsx`).
- Deleted refund-related components and services (`src/components/UserRefundInfo.tsx`, `src/components/admin/RefundRequestModal.tsx`, `src/components/admin/RefundManagementPanel.tsx`, `src/components/RefundStatusBadge.tsx`, `src/services/refundService.ts`).
- Removed refunded status handling in admin order status update and stats (`src/app/api/admin/orders/[id]/status/route.ts`, `src/app/api/admin/orders/stats/route.ts`, `src/services/adminOrderService.ts`).
- Removed refund status from payment type definitions and deleted refund order API route (`src/types/database.ts`, `src/app/api/orders/[id]/refunds/route.ts`).
- Fixed voucher stats display by aligning service/API field names (`src/services/voucher.service.ts`, `src/features/vouchers/MyVouchersPage.tsx`).

## Tests
- Not run (recommend: open "我的优惠券" to verify stats counts render; open admin order list/detail to confirm no refund actions or refunded status appear).
