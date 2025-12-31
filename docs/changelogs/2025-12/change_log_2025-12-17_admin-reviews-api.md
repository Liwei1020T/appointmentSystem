# Change Log — 2025-12-17

## Summary
Enabled admin review management by adding admin review APIs, reply support, and review schema fields.

## Changes
- Added admin review endpoints: `GET /api/admin/reviews`, `GET /api/admin/reviews/stats`, and `POST /api/admin/reviews/{id}/reply`.
- Added admin reply fields to the review model (`admin_reply`, `admin_reply_at`, `admin_reply_by`) and aligned documentation.
- Updated admin review UI to accept wrapped API responses.

## Database Migration
```sql
ALTER TABLE reviews
  ADD COLUMN admin_reply TEXT,
  ADD COLUMN admin_reply_at TIMESTAMPTZ(6),
  ADD COLUMN admin_reply_by UUID;
```

## Tests
- Not run (recommend: open `/admin/reviews`, verify list + stats load, submit a reply).
