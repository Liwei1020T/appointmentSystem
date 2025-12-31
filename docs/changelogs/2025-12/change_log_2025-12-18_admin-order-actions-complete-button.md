# Change Log — 2025-12-18

## Summary
Replaced Admin Order Detail “更多状态” with a single “已完成” action button.

## Changes
- Updated `src/components/admin/AdminOrderDetailPage.tsx`:
  - Removed the “更多状态” trigger in the header.
  - Added a single “已完成” button (shown when order status is not `completed/cancelled`) that opens the existing completion flow.

## Tests
- Manual: open an in-progress/confirmed order → verify header shows “已完成” button and no “更多状态” button → complete order successfully.

