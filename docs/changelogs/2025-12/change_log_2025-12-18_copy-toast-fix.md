# Change Log — 2025-12-18

## Summary
Fixed missing “copy” feedback on Profile page by making Toast visible globally and adding clipboard fallback handling.

## Changes
- Updated `src/components/Toast.tsx` to render as a fixed top-center overlay (`z-50`) so it is visible regardless of scroll position.
- Updated `src/features/profile/ProfilePage.tsx` copy handler to:
  - `await` clipboard write,
  - fallback to `document.execCommand('copy')` when Clipboard API is unavailable,
  - show error toast when copy fails.

## Tests
- Manual: open Profile page → click “复制” → confirm toast appears and clipboard contains the referral code.

