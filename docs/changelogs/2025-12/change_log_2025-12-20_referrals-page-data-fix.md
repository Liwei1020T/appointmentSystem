# Change Log — 2025-12-20

## Summary
Fixed referral page data mapping to align with `/api/referrals` response shape so stats and list render correctly.

## Changes
- UI: `src/features/profile/ReferralsPage.tsx` now unwraps `{ success, data }`, reads `stats` payload, and maps referral logs into display fields.

## Tests
- Manual: open “邀请好友” page → verify referral code, counts, and list render without blank/zero values when data exists.
