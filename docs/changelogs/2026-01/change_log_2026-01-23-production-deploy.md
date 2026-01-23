# Change Log — 2026-01-23

## Summary
Switched the app to production mode (build + start) and resolved a build blocker in the profile page import.

## Changes
- Fixed `MembershipTier` import in the profile page to match exported types.
- Built the Next.js production bundle and started `next start` on port 3000.
- Cleaned AppleDouble `._*` artifacts in `node_modules` to prevent native module load failures during build.

## Tests
- npm test
- npm run build
