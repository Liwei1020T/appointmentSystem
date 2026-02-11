# Final Any Elimination Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate remaining `any` usages in `src`, keep behavior unchanged, and complete full project verification.

**Architecture:** Refactor remaining API/UI/service callsites to `unknown` + type guards or concrete interfaces, keep API contracts stable, and validate with targeted tests plus full type/lint/test/build gates.

**Tech Stack:** Next.js 14, TypeScript (strict), Zod, Vitest, Prisma.

### Task 1: Baseline remaining `any` usage

**Files:**
- Modify: `docs/plans/2026-02-11-any-elimination-final-pass.md`
- Scan: `src/**/*.ts`, `src/**/*.tsx`

**Step 1: Verify current baseline**
- Run: `rg -n "\\bany\\b" src`
- Expected: Remaining hits list only in known files.

**Step 2: Group files by fix pattern**
- API routes: replace `catch (error: any)` and `z.any()`
- UI code: replace cast/index access `as any`
- Form handlers: replace `err: any` with `unknown` helper extraction

### Task 2: API route hardening

**Files:**
- Modify: `src/app/api/admin/announcements/route.ts`
- Modify: `src/app/api/admin/announcements/[id]/route.ts`
- Modify: `src/app/api/admin/reports/export/route.ts`
- Modify: `src/app/api/admin/vouchers/route.ts`

**Step 1: Write failing tests (if behavior change)**
- Add/extend route validation tests if schema semantics change.

**Step 2: Implement minimal fixes**
- Convert catches to `unknown`.
- Replace `z.any()` with explicit union/preprocess schema.

**Step 3: Run targeted checks**
- Run: `npm run type-check`
- Expected: No new type errors from API routes.

### Task 3: UI and feature typing cleanup

**Files:**
- Modify: `src/components/**/*.tsx` (remaining `any` hits)
- Modify: `src/features/**/*.tsx` (remaining `any` hits)

**Step 1: Write/adjust focused tests where utility logic is extracted**
- Ensure fallback message and rendering behavior remains stable.

**Step 2: Replace `any` with precise types**
- Use `Record<string, unknown>` for dynamic maps.
- Use discriminated unions/type guards for session/order/voucher data.
- Replace error handling with `unknown` and reusable message extractor.

**Step 3: Run targeted tests**
- Run: `npm run test:run -- src/__tests__/serviceErrorHandling.test.ts`
- Expected: PASS.

### Task 4: Full verification and documentation

**Files:**
- Modify: `docs/changelogs/2026-02/change_log_2026-02-11_any-elimination-final-pass.md` (new)

**Step 1: Run full validation**
- `npm run type-check`
- `npm run lint`
- `npm run test:run`
- `npm run build`

**Step 2: Record change log**
- Summarize files changed and verification outcomes.
