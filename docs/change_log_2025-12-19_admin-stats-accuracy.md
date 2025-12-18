# Change Log — 2025-12-19

## Summary
Fixed admin dashboard stat API so cards show real “today/month” counts and revenue instead of mirroring lifetime totals.

## Changes
- `/api/admin/stats` now calculates:
  - today/month orders + completed revenue (using `createdAt` + `completedAt`)
  - low-stock count (string inventory under threshold)
  - pending order count
  - active user packages
- Dashboard also now fetches `/api/admin/orders?limit=5` so “最近订单” panel shows the latest rows instead of always showing the empty state.
- `AdminDashboardPage` now reads those new fields directly.

## Tests
- Manual smoke: open `/admin` dashboard, verify “今日订单” vs “本月订单” no longer identical, and low-stock/pending numbers match DB.
