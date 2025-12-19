# Change Log — 2025-12-20

## Summary
Fixed profile edit persistence by aligning UI payloads, API handling, and database fields for name, phone, address, and avatar.

## Changes
- Database: added `users.address` and `users.avatar_url` columns.
- API: `GET /api/profile` now returns `address` and `avatar_url` alongside existing fields.
- API: `PATCH /api/profile` now accepts `fullName` or `full_name`, plus `address` and `avatar_url`.
- Service: `updateProfile()` now maps `full_name` to `fullName` and includes `address`/`avatar_url`.

## Tests
- Manual: edit profile name/phone/address/avatar → save → refresh profile page and confirm data persists.
