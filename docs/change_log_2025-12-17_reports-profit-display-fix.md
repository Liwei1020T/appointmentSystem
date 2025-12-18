# Change Log — 2025-12-17

## Summary
Fixed Admin Reports “Profit by Product” table showing blank product name/type due to payload field mismatches, and normalized profit margin units for consistency.

## Changes
- UI: `src/components/admin/AdminReportsPage.tsx`
  - Added defensive field mapping (`productName`/`name`, `productType`/`type`) to avoid blank cells when API payload keys differ.
  - Normalized margin display to support both ratio (0–1) and percent (0–100) inputs.
- API: `src/app/api/admin/reports/profit/route.ts`
  - Updated `profitByCategory[].margin` to return percent (0–100) to match `profitMargin` and UI expectations.

## Impact
- Admin “报表分析” page now consistently shows product names/types in the profit breakdown table.
- Margin values are consistent across report sections.

## Tests
- Manual: open `/admin/reports` and verify “Profit by Product” table shows `PRODUCT` and `TYPE` for completed orders.

