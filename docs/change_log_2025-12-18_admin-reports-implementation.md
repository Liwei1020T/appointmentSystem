# Change Log — 2025-12-18

## Summary
Implemented real Admin Reports APIs (revenue/profit/sales/top strings/packages/user growth/order trends + CSV export) and updated documentation to reflect that the reports module is no longer placeholder-only.

## Changes
- API: Implemented `/api/admin/reports` summary KPI (revenue/orders/customers).
- API: Implemented `/api/admin/reports/revenue` with daily trend + category breakdown (orders vs packages) and growth rate.
- API: Implemented `/api/admin/reports/profit` with Profit by Product (strings + packages) and category margins.
- API: Implemented `/api/admin/reports/sales` with completion/package/voucher rates, status breakdown, and daily sales trend.
- API: Implemented `/api/admin/reports/top-strings` (completed orders grouped by string).
- API: Implemented `/api/admin/reports/top-packages` (confirmed package payments grouped by package) + basic utilization rate.
- API: Implemented `/api/admin/reports/user-growth` (daily new users + source split direct/referral).
- API: Implemented `/api/admin/reports/order-trends` (by hour / day of week / month + avg completion time).
- API: Implemented `/api/admin/reports/export` CSV exporter for report tabs.
- UI: Fixed `AdminReportsPage` export to handle Blob correctly.

## Data Rules
- Revenue uses confirmed payments: `payments.status in ['success','completed']` (covers order payments + package purchases).
- Sales uses completed orders: `orders.status = 'completed'` and `orders.price` for sales amount.
- Profit uses orders’ `profit` if available; otherwise `(price - cost)` fallback; packages treated as 100% profit (no cost model).

## Docs
- Updated `docs/api_spec.md` to remove Admin Reports placeholder note and list implemented report endpoints.
- Updated `docs/PROJECT_STATUS.md` to mark data visualization as completed and report export as partially done (CSV done, Excel/PDF pending).

## Tests
- Manual: Open `/admin/reports` with a date range containing data; verify charts and tables populate.
- Manual: Click “Export CSV” on each tab; verify a CSV downloads and contains rows.

