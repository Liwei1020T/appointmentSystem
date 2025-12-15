# Change Log — 2025-12-12

## Summary
Added a single-run bootstrap script (`sql/full_schema.sql`) that recreates the entire Supabase database schema, policies, and triggers for the String Service Platform.

## Changes
- New script `sql/full_schema.sql` covering:
  - Core tables: users, string_inventory, packages/user_packages, orders, payments, vouchers/user_vouchers
  - Supporting tables: points_log, referral_logs, stock_logs, notifications/notification_preferences/email_logs, system_settings, refunds
  - Feature tables: order_reviews (with points reward trigger), order_photos (with has_photos flag), order_numbers, receipts, inventory and referral automation
  - RLS policies and helper triggers for updated_at, referral rewards, order completion (profit/points/stock/notifications), package status, and analytics RPCs
- System settings defaults stored as JSON for points, referrals, low-stock threshold, and SMS toggle.

## Tests
- Not run in this workspace. After applying on Supabase run:
  - `supabase db reset --db-url <url>` or `psql -f sql/full_schema.sql`
  - Smoke-check tables: `\dt public.*`
  - Verify policies: `SELECT tablename, polname FROM pg_policies WHERE schemaname='public';`
  - Validate triggers: `SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE NOT tgisinternal;`
