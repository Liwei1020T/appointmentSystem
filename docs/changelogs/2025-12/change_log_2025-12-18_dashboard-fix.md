# Change Log — 2025-12-18

## Summary
Fixed incorrect dashboard data display where total stats were being shown as daily/monthly stats.

## Changes
- **API Updates**:
  - Updated `GET /api/admin/stats` to correctly calculate:
    - Today's orders and revenue (based on `createdAt` and `completedAt`).
    - This month's orders and revenue.
    - Recent orders (last 5 orders with user and string details).
  - Fixed a bug where the API crashed due to querying `user.name` instead of `user.fullName`.
- **UI Updates**:
  - Updated `AdminDashboardPage.tsx` to correctly map the new API response fields.
  - Enabled "Recent Orders" list on the dashboard.

## Tests
- Verified that "今日订单" and "本月订单" now show different values based on the actual date ranges.
- Verified that "最近订单" list is now populated with real data.
