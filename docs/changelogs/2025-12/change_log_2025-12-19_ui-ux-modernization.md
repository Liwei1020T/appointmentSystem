# Change Log — 2025-12-19

## Summary
Applied the Kinetic Precision 2.0 visual system across shared layout and core UI components.

## Changes
- Updated design tokens in `tailwind.config.js` to align with dark palette, Volt accent, and mono typography.
- Refreshed global styles in `src/app/globals.css` with dark base, glass utilities, and reduced-motion support.
- Modernized shared components to new tokens:
  - `src/components/Button.tsx`
  - `src/components/Card.tsx`
  - `src/components/Input.tsx`
  - `src/components/Select.tsx`
  - `src/components/Checkbox.tsx`
  - `src/components/Badge.tsx`
  - `src/components/StatsCard.tsx`
  - `src/components/Table.tsx`
  - `src/components/Tabs.tsx`
  - `src/components/Toast.tsx`
  - `src/components/Modal.tsx`
- Updated navigation layers to glass/ink styling:
  - `src/components/layout/Navbar.tsx`
  - `src/components/Sidebar.tsx`
  - `src/components/BottomNav.tsx`
- Updated layout background in `src/app/layout.tsx`.
- Updated docs: `docs/UI-Design-Guide.md`, `docs/components.md`.

## Tests
- Manual: visually verify navbar, buttons, forms, stats cards, tables, modals, and toast styles in both desktop and mobile.
