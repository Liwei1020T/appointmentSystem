# Change Log — 2025-12-29

## Summary
Aligned admin loading states to the shared loading components for consistent UX across admin pages and modals.

## Changes
- Replaced admin page-level loading spinners with `PageLoading` on orders, inventory, packages, vouchers, users, payments, and reports.
- Standardized list/section loading blocks to `SectionLoading` in admin lists and modals.
- Swapped low-stock refresh placeholder to `InlineLoading` for consistent inline feedback.

## Tests
- Not run (not requested).
