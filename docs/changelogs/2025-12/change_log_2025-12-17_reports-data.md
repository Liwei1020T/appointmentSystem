# Change Log — 2025-12-17

## Summary
Implemented real admin report data sources so the analytics dashboard shows live metrics.

## Changes
- Implemented revenue, profit, sales, top strings, top packages, user growth, and order trends report APIs with Prisma.
- Added growth and breakdown fields used by the reports dashboard charts.
- Implemented CSV export with real data for revenue/sales/strings/packages/users/orders.
- Updated report API documentation to reflect live endpoints.

## Tests
- Not run (recommend: open `/admin/reports` and verify cards/charts populate; try CSV export).
