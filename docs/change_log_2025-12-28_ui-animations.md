# Change Log — 2025-12-28

## Summary
Applied consistent entrance animations to all major feature pages to match the "Package Purchase" page experience.

## Changes
- **Home Page (`src/features/home/HomePage.tsx`)**: Added `isVisible` state and `opacity/translate` transition to the main content container.
- **Booking Flow (`src/features/booking/BookingFlow.tsx`)**: Applied entrance animation to the booking form container.
- **Order List (`src/features/orders/OrderList.tsx`)**: Added entrance animation to the order list view.
- **Profile Page (`src/features/profile/ProfilePage.tsx`)**: Applied entrance animation to the profile content (cards below header).
- **Points Center (`src/features/profile/PointsCenterPage.tsx`)**: Added entrance animation to the points and voucher management interface.

## Technical Details
- Used `useEffect` with a 100ms timeout to trigger `isVisible` state on mount.
- Applied Tailwind classes: `transition-all duration-700 ease-out` with toggle between `opacity-100 translate-y-0` and `opacity-0 translate-y-4`.
- Ensured consistent visual rhythm across the application.
