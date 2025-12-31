# Change Log — 2025-12-18

## Summary
Simplified Malaysian phone number input so users can type local format like `01131609008` without `+60`.

## Changes
- Added helper: `normalizeMyPhone()` in `src/lib/utils.ts` to strip non-digits for phone inputs.
- Updated phone inputs to be digit-only with clearer placeholders/help:
  - `src/features/auth/SignupPage.tsx`
  - `src/features/auth/ProfilePage.tsx`
  - `src/features/profile/EditProfilePage.tsx`

## Tests
- Manual: sign up with phone `01131609008` → passes validation and account is created.
- Manual: edit profile phone with digits only → passes validation and saves successfully.

