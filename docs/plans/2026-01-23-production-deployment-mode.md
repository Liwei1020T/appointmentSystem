# Production Deployment Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run the LW String Studio app in production mode (build + start) on port 3000 behind the existing Cloudflared tunnel.

**Architecture:** Build the Next.js app in an isolated worktree, ensure the runtime environment variables are present, stop any dev servers, and start `next start` on port 3000. Verify static assets and login page load correctly through the tunnel.

**Tech Stack:** Next.js 14, Node.js, Prisma, Cloudflared

---

### Task 1: Prepare production environment in worktree

**Files:**
- Modify: `.env` (copy from main workspace)

**Step 1: Copy env file into worktree**

```bash
cp /Volumes/TLW/备份/ArtSport/string/.env /Volumes/TLW/备份/ArtSport/string/.worktrees/deploy-production-mode/.env
```

Expected: `.env` exists in worktree root.

**Step 2: Install dependencies**

```bash
npm install
```

Expected: `prisma generate` runs successfully during postinstall.

---

### Task 2: Build the production bundle

**Files:**
- Modify: `.next/` (build output)

**Step 1: Run build**

```bash
npm run build
```

Expected: Build completes with route output table and exit code 0.

---

### Task 3: Stop dev server and start production server

**Files:**
- None

**Step 1: Stop any running dev servers**

```bash
pkill -f "next/dist/bin/next dev"
```

Expected: No `next dev` processes remain.

**Step 2: Start production server**

```bash
nohup npm run start >/tmp/next-start.log 2>&1 &
```

Expected: Server listens on port 3000.

---

### Task 4: Verify local and remote endpoints

**Files:**
- None

**Step 1: Verify local login page**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login
```

Expected: `200`.

**Step 2: Verify local main-app asset**

```bash
main_app=$(curl -s http://localhost:3000/login | rg -o "/_next/static/chunks/main-app[^\"']+" | head -n 1)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000${main_app}
```

Expected: `200`.

**Step 3: Verify remote main-app asset**

```bash
remote_main=$(curl -s https://lwstringstudio.li-wei.net/login | rg -o "/_next/static/chunks/main-app[^\"']+" | head -n 1)
curl -s -o /dev/null -w "%{http_code}\n" https://lwstringstudio.li-wei.net${remote_main}
```

Expected: `200`.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-01-23-production-deployment-mode.md`.

Two execution options:

1. Subagent-Driven (this session) — I dispatch a fresh subagent per task, review between tasks
2. Parallel Session (separate) — Open new session with executing-plans, batch execution with checkpoints

Which approach?
