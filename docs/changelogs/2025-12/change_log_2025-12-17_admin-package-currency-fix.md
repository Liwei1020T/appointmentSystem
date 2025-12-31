# Change Log — 2025-12-17

## Summary
Fixed admin package detail page crash caused by Prisma Decimal/string values being passed into `.toFixed()`.

## Changes
- `src/components/admin/AdminPackageDetailPage.tsx`
  - Added a `toNumber()` helper to normalize `number | string | Decimal`-like values.
  - Updated currency and date formatting to be defensive and browser-safe.
  - Fixed revenue aggregation to avoid string concatenation when price is a string.

## Database
- No database changes required.

## Tests
- Manual: open `/admin/packages/{id}` and confirm the page renders and currency fields display correctly.

