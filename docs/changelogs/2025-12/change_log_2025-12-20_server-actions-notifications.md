# Change Log — 2025-12-20

## Summary
Migrated user notifications from API routes to Server Actions and updated client usage accordingly.

## Changes
- Added Server Actions for notification list, read, and delete operations.
- Updated notification service to call Server Actions instead of `/api/notifications` routes.
- Removed legacy notification API routes.
- Documented the change in API spec.

## Tests
- Manual UI test: open notification panel, mark as read, delete notifications.
