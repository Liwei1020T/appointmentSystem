# Change Log — 2025-12-20

## Summary
Fixed change-password page 404 by routing profile password updates to the implemented `/api/user/password` endpoint.

## Changes
- Service: `changePassword()` in `src/services/profileService.ts` now calls `PUT /api/user/password` and handles `{ success, error }` responses.

## Tests
- Manual: open “修改密码” page → submit current + new password → verify success toast and no 404 in console.
