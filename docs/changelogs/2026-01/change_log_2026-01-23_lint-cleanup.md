# Change Log — 2026-01-23

## Summary
Cleaned lint errors and aligned ESLint configuration for script utilities.

## Changes
- Removed stray expression artifacts in multi-racket booking flow and admin package modal actions.
- Escaped unescaped text in admin inventory and payment UI copy.
- Normalized voucher discount calculation to use `const`.
- Allowed CommonJS `require()` usage in `scripts/**/*.js` via ESLint override.
- Updated order timeline mapping and tests for the consolidated status flow.
- Removed unused Membership tier import in profile page.

## Tests
- `npm run lint`
- `npm run test:run`
- `npm run type-check`
