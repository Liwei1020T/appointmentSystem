# Change Log — 2025-12-20

## Summary
Show user avatar on the profile header when `avatar_url` is available, with initials fallback.

## Changes
- UI: `src/features/profile/ProfilePage.tsx` now renders the saved avatar image and falls back to initials if missing.

## Tests
- Manual: upload avatar → save profile → refresh profile page → avatar renders in header.
