# Change Log — 2025-12-19

## Summary
Modernized the Home and Booking flows to the Kinetic Precision 2.0 visual system (dark layers, Volt accents, glass surfaces).

## Changes
- Updated Home page visuals for dark palette, accent CTAs, and mono numerics:
  - `src/features/home/HomePage.tsx`
  - `src/features/home/QuickActions.tsx`
  - `src/features/home/RecentOrders.tsx`
  - `src/features/home/PackageSummary.tsx`
  - `src/components/FeaturedReviews.tsx`
- Updated Booking flow visuals for dark palette, accent progress, and glass headers:
  - `src/features/booking/BookingFlow.tsx`
  - `src/features/booking/StringSelector.tsx`
  - `src/features/booking/TensionInput.tsx`
  - `src/features/booking/VoucherSelector.tsx`

## Tests
- Manual: home page (hero, quick actions, package summary, recent orders, featured reviews).
- Manual: booking flow steps 1–4 (string selection, tension input, vouchers, confirmation and price breakdown).
