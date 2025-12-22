# Change Log — 2025-12-20

## Summary
Migrated profile, points, referrals, vouchers, and stats APIs to Server Actions and updated client usage.

## Changes
- Added Server Actions for profile, password, stats, points, referrals, vouchers, and system stats.
- Updated profile/points/voucher/referral/home services and related profile pages to call Server Actions.
- Removed legacy API routes for profile, points, referrals, vouchers, stats, and user password.
- Updated system design and API spec notes to reflect Server Action usage.

## Tests
- Manual UI check: profile load/save, points center list/redeem, referrals page, my vouchers page.
