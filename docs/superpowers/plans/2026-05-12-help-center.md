# Help Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app `/help` help center reached from a `?` icon in the top-right header.

**Architecture:** The feature is frontend-only. Help content lives in a typed static data module, `/help` renders searchable module cards and document detail content, and `V2Header` routes the `?` icon to `/help`.

**Tech Stack:** Next.js App Router, React client components, Tailwind classes, Ant Design tooltip, lucide-react icons, Playwright smoke checks.

---

## File Structure

- Create `apps/web/src/data/help-center.ts`: typed static help modules and FAQ content.
- Create `apps/web/src/app/(app)/help/page.tsx`: searchable help center UI.
- Modify `apps/web/src/components/v2/V2Header.tsx`: add `CircleHelp` icon button that routes to `/help`.

## Tasks

### Task 1: Baseline Failing Smoke

**Files:**
- No production files changed.

- [ ] **Step 1: Run a failing check before implementation**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const required = [
  'apps/web/src/app/(app)/help/page.tsx',
  'apps/web/src/data/help-center.ts',
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error('Missing help center files:', missing.join(', '));
  process.exit(1);
}
NODE
```

Expected: FAIL because the help page and help data module do not exist yet.

### Task 2: Static Help Data

**Files:**
- Create: `apps/web/src/data/help-center.ts`

- [ ] **Step 1: Add typed help content**

Implement exported `helpModules` and `helpFaqs` arrays. Each module includes `id`, `title`, `description`, `icon`, `keywords`, `sections`, and `quickActions`. Cover all modules listed in the design spec.

- [ ] **Step 2: Verify the data file exists**

Run the Task 1 command again.

Expected: still FAIL because `/help/page.tsx` is not created yet.

### Task 3: Help Page UI

**Files:**
- Create: `apps/web/src/app/(app)/help/page.tsx`

- [ ] **Step 1: Implement `/help`**

Build a client page with:

- Search input.
- Featured quick-start area.
- Module cards filtered by search.
- Selected module detail area with left-side section list and right-side content.
- FAQ section.
- Responsive single-column layout on mobile.

- [ ] **Step 2: Verify baseline smoke passes**

Run the Task 1 command again.

Expected: PASS.

### Task 4: Header Entry

**Files:**
- Modify: `apps/web/src/components/v2/V2Header.tsx`

- [ ] **Step 1: Add icon import and button**

Add `CircleHelp` from `lucide-react`. Render a tooltip-wrapped button between invite and notification. On click, call `router.push('/help')`.

- [ ] **Step 2: Build web**

Run:

```bash
pnpm build:web
```

Expected: PASS.

### Task 5: Deploy and Verify

**Files:**
- No additional source changes.

- [ ] **Step 1: Deploy Web by SOP**

Run the existing SOP sequence: rsync standalone/static/public, copy static/public into standalone, restart `yzschros-web`.

- [ ] **Step 2: Production smoke**

Use Playwright against `http://47.97.62.57` to verify:

- `/help` loads after authenticated cookie injection.
- Header has a `帮助中心` or `打开帮助中心` accessible entry.
- `/dashboard`, `/candidates`, `/jobs`, `/settings`, and `/client/login` still load without 404/500/page errors.
