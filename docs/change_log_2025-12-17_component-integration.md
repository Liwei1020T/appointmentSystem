# Change Log — 2025-12-17

## Summary
Wired previously unused page and admin components into active routes and screens.

## Changes
- Switched `/vouchers` and `/points` routes to use the component-based pages (`src/components/features/MyVouchersPage.tsx`, `src/components/features/PointsHistoryPage.tsx`).
- Updated `/orders` to render `src/components/orders/OrderListPage.tsx` and used `src/components/Container.tsx` for consistent layout.
- Replaced the inline stock log UI in the inventory detail page with `src/components/admin/StockHistory.tsx`.
- Documented integrated page components in `docs/components.md`.

## Tests
- Not run (recommend: open `/orders`, `/points`, `/vouchers`, and an inventory detail page to confirm layout and data).
