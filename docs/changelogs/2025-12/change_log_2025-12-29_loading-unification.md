# Change Log — 2025-12-29

## Summary
Introduced a unified loading component outlet and aligned button loading and dashboard skeleton behavior to the shared Spinner/Skeleton system.

## Changes
- Added loading outlet components: `LoadingSpinner`, `PageLoading`, `SectionLoading`, `InlineLoading` (`src/components/loading/*`).
- Exported loading helpers from `src/components/index.ts` for consistent imports.
- Standardized Button loading to reuse `Spinner` (`src/components/Button.tsx`).
- Fixed admin dashboard chart skeleton heights to use stable Tailwind classes (`src/components/skeletons/DashboardSkeleton.tsx`).
- Added route-level `loading.tsx` for key user flows (orders, booking, profile, points, packages, reviews, payment result).
- Replaced Suspense fallbacks with `PageLoading` in signup, packages, package purchase, payment result, and points center.
- Unified page-level loading states to `PageLoading` for home, booking flows, order detail, admin reviews, and auth/profile screens.
- Replaced scattered spinner blocks with `SectionLoading`/`InlineLoading` and review/home skeletons for consistent in-page loading.
- Replaced remaining `Loader2` usage in upload/admin/referral flows with unified loading components.

## Tests
- Not run (not requested).
