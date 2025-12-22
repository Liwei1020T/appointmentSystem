# Change Log — 2025-12-20

## Summary
Migrated packages, reviews, and inventory (including admin reviews/inventory) to Server Actions and updated client usage.

## Changes
- Added Server Actions for packages, reviews (user/admin), and inventory (user/admin).
- Updated package/review/inventory services and UI pages to call Server Actions instead of API routes.
- Removed legacy API routes for packages, reviews, and inventory (including admin reviews/inventory).
- Updated API spec note to reflect the migration scope.

## Tests
- Manual UI check: featured reviews, my reviews, admin reviews list/reply.
- Manual UI check: packages list, my packages, package usage history, package purchase flow.
- Manual UI check: inventory list/details and admin inventory create/update/stock adjust.
