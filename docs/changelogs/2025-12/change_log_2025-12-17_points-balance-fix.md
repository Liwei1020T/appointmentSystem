# Change Log — 2025-12-17

## Summary
Fixed incorrect points balance display by aligning the points service with the API response shape.

## Changes
- Normalized `/api/points` response parsing to read `data.balance` and coerce to a number in `src/services/points.service.ts`.

## Tests
- Not run (recommend opening the voucher exchange page and points history to confirm the balance matches the user profile).
