# Change Log — 2025-12-19

## Summary
Changed referral codes to **6-digit numeric** format and added automatic migration for legacy long codes.

## Changes
- API:
  - `src/app/api/profile/referral-code/route.ts`
    - Now returns a 6-digit numeric code.
    - If the current user has a legacy (non-6-digit) code, it migrates to a new 6-digit code and updates references:
      - `users.referred_by`
      - `referral_logs.referral_code`
- Signup:
  - `src/app/api/auth/signup/route.ts`
    - New users are created with a unique 6-digit numeric `referralCode` instead of the Prisma default cuid.
- Docs:
  - `docs/api_spec.md` referral code example updated to 6 digits.
  - `docs/erd.md` notes `referral_code` as 6-digit.

## Impact
- Old referral codes will be replaced once the user triggers `/api/profile/referral-code` (Profile/Referral UI call).
- After migration, the old code will no longer work for new referrals.

## Tests
- Manual:
  - Open Profile/Referral page → referral code becomes 6 digits.
  - Register new account → referral code is 6 digits.
  - Use referral code during signup → referral reward still applies.

