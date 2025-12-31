# Change Log — 2025-12-17

## Summary
Aligned review APIs with the actual reviews table so user-facing review displays match submitted data.

## Changes
- Implemented `GET /api/reviews/user` and `GET /api/reviews/order/{orderId}` using Prisma.
- Updated `POST /api/reviews` to persist reviews (validate order ownership + completed status).
- Mapped review payloads to include order string info and final price so cards render correctly.
- Updated server-side review service queries to use the `reviews` table instead of `order_reviews`.
- Documented the updated review API status in `docs/api_spec.md`.

## Tests
- Not run (recommend: submit a review, refresh order detail and profile review list to confirm rating/comment match).
