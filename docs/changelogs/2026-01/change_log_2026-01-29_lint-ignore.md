# Change Log — 2026-01-29

## Summary
Added ESLint ignore rules for macOS metadata files to keep lint runs clean.

## Changes

### Added
- `.eslintignore` to skip `**/._*` and `**/.DS_Store`.

### Modified
- None.

### Fixed
- Reduced lint noise from macOS metadata files.

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `.eslintignore` | Added | Ignore macOS metadata files in linting. |

## API Changes
- None.

## Database Changes
- None.

## Testing
- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] `npm run test:run`
- [ ] `npm run build`
