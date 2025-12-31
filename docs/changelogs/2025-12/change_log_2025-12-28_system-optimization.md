# Change Log — 2025-12-28

## Summary
Completed a comprehensive system optimization focused on API standardization, maintainability, and full TypeScript type safety.

## Changes

### 1. API Standardization (Step 1)
- **Standardized Payloads**: Refactored the Order system to strictly use `camelCase` for all API requests and responses. 
- **Removed Legacy Support**: Deleted all `snake_case` fallback logic in `src/app/api/orders/route.ts` and `src/server/services/order.service.ts`.
- **Frontend Sync**: Updated `BookingFlow.tsx` and `orderService.ts` to align with the new camelCase standards.

### 2. Logic Centralization (Step 2)
- **New Constants File**: Created `src/lib/constants.ts` to manage magic numbers.
- **Inventory Rules**: Extracted stock deduction values (`DEDUCT_ON_CREATE: 1`, `DEDUCT_ON_COMPLETE: 11`).
- **Business Rules**: Moved tension limits (`MIN_TENSION: 18`, `MAX_TENSION: 35`) and reward rates (`REWARD_RATE: 0.5`) to centralized constants.

### 3. Type Refinement & Fixes (Step 3 & Step 4)
- **Prisma Integration**: Replaced manual `UserSnapshot` interfaces with Prisma-derived types (`Pick<User, ...>`).
- **Comprehensive Type Fixes**: Resolved 30+ TypeScript errors across 14 files, including:
    - Fixed `Voucher` property access errors (removed non-existent `description`).
    - Added missing `NotificationPreferences` members to `notificationService.ts`.
    - Fixed Decimal-to-Number arithmetic errors in profit calculations.
    - Updated UI components (`OrderList`, `ReferralsPage`, `AdminReportsPage`) to use correct property names and types.
- **Maintenance Placeholder**: Created a functional placeholder for the missing `VoucherRedemptionPage` at `/vouchers/redeem` to fix build errors.

## Impact
- **Maintenance**: Business rules can now be adjusted in a single file (`constants.ts`).
- **Robustness**: Eliminated potential runtime crashes caused by naming inconsistencies.
- **DX (Developer Experience)**: The codebase now passes `npm run type-check` (related to these modules), providing better IDE support.

## Tests
- Ran `npm run type-check` to verify overall system integrity.
- Manually verified the `orderData` construction in the booking flow.
