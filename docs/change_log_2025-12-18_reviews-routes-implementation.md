# Change Log — 2025-12-18

## Summary
Implemented real, Prisma-backed review APIs (submit/list/order/featured) and fixed review data flow so UI reads persisted data instead of stubs.

## Changes
- Implemented review endpoints:
  - `POST /api/reviews` (validate completed order ownership, persist review, award 10 points + write `points_log`)
  - `GET /api/reviews/user` (current user review list)
  - `GET /api/reviews/order/:orderId` (single order review)
  - `GET /api/reviews/featured` (homepage featured reviews)
- Refactored `src/services/review.service.ts` to use API routes (removed legacy `order_reviews` raw SQL references).
- Aligned admin reviews:
  - Admin review list/stats now return real review fields (tags, anonymity, sub-ratings, admin reply).
  - Admin reviews UI now unwraps `{ success, data }` responses correctly.
- Updated Prisma schema and SQL schema to include review extended fields (tags, anonymity, sub-ratings, admin reply).

## Database Migration
- Added `sql/migrations/013_extend_reviews_fields.sql`:
  - Adds columns to `reviews`: `tags`, `is_anonymous`, `service_rating`, `quality_rating`, `speed_rating`, `admin_reply`, `admin_reply_at`, `admin_reply_by`.

## Docs
- Updated `docs/api_spec.md` to move `/api/reviews/*` from placeholder → implemented endpoints.
- Updated `docs/System-Design-Document.md` review module note to reflect real implementation.
- Updated `docs/erd.md` `reviews` table definition to include new columns.

## Tests
- Manual smoke test:
  - Complete an order → submit review → refresh order detail and “我的评价” pages.
  - Open `/admin/reviews` → verify list + stats load → submit an admin reply → verify user pages display `admin_reply`.
  - Open homepage → verify featured reviews appear when there are reviews with `rating >= 4` and `comment >= 10` characters.

