# Change Log — 2026-01-27

## Summary
Comprehensive security hardening and frontend bug fixes based on system review.

## Changes

### Added
- **Database Indexes**: Added composite indexes for query performance optimization
  - `Order`: `@@index([userId, status, createdAt])` - User order list queries
  - `Order`: `@@index([status, lastStatusChangeAt])` - Order status tracking
  - `UserPackage`: `@@index([userId, status, expiry])` - Active package queries
  - `Notification`: `@@index([userId, read, createdAt])` - Unread notification queries

### Modified
- **TNG Webhook Security** (`src/app/api/payments/tng/callback/route.ts`)
  - Added HMAC-SHA256 signature verification for webhook requests
  - Added timing-safe comparison to prevent timing attacks
  - Added idempotency check to prevent duplicate payment processing
  - Added production environment validation for `TNG_WEBHOOK_SECRET`

- **CRON Security** (`src/app/api/cron/cleanup-orders/route.ts`)
  - Added timing-safe secret comparison using `crypto.timingSafeEqual`
  - Added production environment validation to reject weak/missing secrets
  - Prevents timing attacks on CRON secret verification

- **ImageUploader Memory Leak Fix** (`src/components/ImageUploader.tsx`)
  - Fixed premature `URL.revokeObjectURL` calls that caused broken image previews
  - Added `blobUrlsRef` to track blob URLs for proper lifecycle management
  - Added cleanup effect on component unmount to prevent memory leaks
  - Blob URLs now properly cleaned up on: successful upload, failed upload, and unmount

- **NotificationBell Race Condition Fix** (`src/components/NotificationBell.tsx`)
  - Added `active` flag pattern to prevent state updates after component unmount
  - Added error handling to prevent crashes from failed API calls
  - Removed unnecessary `useCallback` dependency

- **FeaturedReviews Performance Fix** (`src/components/FeaturedReviews.tsx`)
  - Changed useEffect dependency from `reviews` array to `reviewsLength`
  - Prevents unnecessary interval recreation when reviews data updates with same length
  - Improves scroll behavior consistency

### Fixed
- Memory leak in ImageUploader causing broken image previews
- Race condition in NotificationBell causing potential crashes on unmount
- Unnecessary re-renders in FeaturedReviews auto-scroll logic
- Potential timing attack vulnerability in CRON and TNG webhook authentication

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `prisma/schema.prisma` | Modified | Added 4 composite indexes for query optimization |
| `src/app/api/payments/tng/callback/route.ts` | Modified | Added webhook signature verification |
| `src/app/api/cron/cleanup-orders/route.ts` | Modified | Added timing-safe secret comparison |
| `src/components/ImageUploader.tsx` | Modified | Fixed memory leak and blob URL cleanup |
| `src/components/NotificationBell.tsx` | Modified | Fixed race condition on unmount |
| `src/components/FeaturedReviews.tsx` | Modified | Optimized useEffect dependencies |

## API Changes
- TNG callback now requires `x-tng-signature` header in production
- CRON endpoint now requires strong `CRON_SECRET` in production

## Database Changes
- 4 new composite indexes added (requires `prisma db push` or migration)

## Environment Variables
New required variables for production:
- `TNG_WEBHOOK_SECRET`: HMAC secret for TNG webhook signature verification
- `CRON_SECRET`: Strong secret for CRON job authentication (no weak defaults in production)

## Testing
- [x] TypeScript type-check passed
- [x] ESLint passed (pre-existing warnings only)
- [x] 57/57 tests passed
- [x] Production build successful
- [x] Prisma schema validation passed

## Security Impact
- **Critical**: TNG webhook now protected against forged payment confirmations
- **High**: CRON endpoint now resistant to timing attacks
- **Medium**: Improved memory management prevents potential DoS via memory exhaustion

## Notes
- Existing orders and payments are not affected
- Database indexes can be applied without downtime using `prisma db push`
- TNG callback will reject requests without valid signature after deployment
