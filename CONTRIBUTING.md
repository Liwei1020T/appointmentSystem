# Contributing to String Service Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or pnpm

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd string

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Start database
docker-compose up -d

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer explicit types over `any`
- Use Prisma-generated types where possible

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `OrderCard.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Files (API routes) | kebab-case folders | `api/orders/[id]/route.ts` |
| Variables | camelCase | `orderTotal` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `OrderStatus` |
| React Components | PascalCase | `OrderTimeline` |

### API Response Format

```typescript
// Success
{ ok: true, data: { ... } }

// Error
{ ok: false, error: { code: "ERROR_CODE", message: "..." } }
```

### CSS/Styling

- Use Tailwind CSS
- Follow the Breathing Design system (see `docs/core/UI-Design-Guide.md`)
- Prefer utility classes over custom CSS

## Git Workflow

### Branch Naming

```
feature/short-description
fix/issue-description
docs/what-changed
refactor/what-changed
```

### Commit Messages

Follow conventional commits:

```
feat: add multi-racket booking support
fix: resolve payment timeout issue
docs: update API specification
refactor: simplify order service logic
test: add voucher validation tests
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Run type check: `npm run type-check`
5. Run lint: `npm run lint`
6. Create a pull request with:
   - Clear description of changes
   - Link to related issue (if any)
   - Screenshots for UI changes

## Documentation Requirements

### For New Features

1. Update relevant docs in `docs/core/`
2. Add changelog entry in `docs/changelogs/YYYY-MM/`
3. Update `docs/status/PROJECT_STATUS.md` if needed

### Changelog Format

```markdown
# Change Log — YYYY-MM-DD

## Summary
Brief description of changes.

## Changes
- Added: new feature
- Fixed: bug description
- Updated: component changes

## Files Changed
| File | Type | Description |
|------|------|-------------|
| ... | ... | ... |

## Tests
- [ ] Manual testing completed
- [ ] Unit tests added/updated
```

## Testing Guidelines

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

### Writing Tests

- Place tests in `src/__tests__/`
- Name test files: `*.test.ts` or `*.test.tsx`
- Use Vitest for testing
- Mock external services appropriately

## Code Review Checklist

Before requesting review, ensure:

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] No console.log statements (use console.info for intentional logging)
- [ ] No TODO/FIXME comments (use NOTE for documentation)
- [ ] Documentation updated
- [ ] Changelog entry added (for features/fixes)

## Getting Help

- Read existing documentation in `docs/`
- Check `CLAUDE.md` for development protocol
- Review similar implementations in codebase

---

**Last Updated:** 2026-01-27
