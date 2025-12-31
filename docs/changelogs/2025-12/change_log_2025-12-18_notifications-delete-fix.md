# Change Log — 2025-12-18

## Summary
Fixed Notifications panel delete action failing with `404 (Not Found)` and “not valid JSON”.

## Changes
- Added API route: `DELETE /api/notifications/:id`
  - File: `src/app/api/notifications/[id]/route.ts`
  - Verifies the notification belongs to the current user before deleting.

## Tests
- Manual: open Notifications panel → click delete icon on a notification → verify it is removed and no 404/JSON parse errors appear in console.

