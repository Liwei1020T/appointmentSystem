# Change Log — 2026-01-23

## Summary
Kept production deploy flow intact while fixing build-time type issues across profile and points views, and ensured dynamic profile APIs skip static rendering.

## Changes
- Fixed analytics AOV trend typing to include `totalSales`.
- Normalized points history mapping to handle Date/string timestamps and unified redeemable voucher types.
- Hardened membership and referral data mapping to guarantee required fields for UI rendering.
- Marked profile membership/badges APIs as `force-dynamic` to avoid static rendering errors.
- Built the Next.js production bundle and started `next start` on port 3000.
- Cleaned AppleDouble `._*` artifacts in `node_modules` to prevent native module load failures during build.

## Tests
- npm test
- npm run build
