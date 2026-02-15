# Task 0052 — Client-Web: Playwright E2E (Board Viewport Camera)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0052-client-web-playwright-e2e-board-viewport`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-005
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: E2E tests and UI hooks are presentation-only and do not introduce client-side legality/cost/majority computation.
* GR-005: No new engine moves/intents are introduced; camera controls are UI-only (no engine actions).
* GR-014: No changes to tile/icon mapping; only adds stable selectors and test coverage.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Establish Playwright E2E testing for `packages/client-web` (headless by default).
* Automatically start required web servers for E2E (client + game server) from the Playwright config.
* Add stable UI selectors for camera/viewport controls to avoid brittle CSS-based tests.
* Add E2E acceptance tests for a “playable camera”: load/no-crash, fit, wheel-zoom, drag-pan, reset.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not change engine rules, legality, state shape, or production logic.
* Do not introduce screenshot baselines yet (can be added later once camera UX stabilizes).
* Do not add new UI features beyond minimal test hooks and (if needed) a dedicated fit/reset control.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/BoardViewport.tsx` (camera wrapper via `react-zoom-pan-pinch`)
  * `packages/client-web/src/components/HexBoard.tsx` (board root element)
  * `packages/client-web/src/components/LobbyScreen.tsx` + `packages/server/src/index.ts` (real join flow for reaching the board)
  * `.github/workflows/ci.yml` (optional CI wiring for E2E)
* Existing behavior summary (current):

  * Board viewport supports pan/zoom and a “Reset view” button (fit-to-bounds).
  * No Playwright configuration or E2E suite exists.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* Playwright config + scripts (root-level) for E2E orchestration.
* Stable `data-testid` hooks:
  * `data-testid="board-viewport"`
  * `data-testid="btn-fit-to-board"`
  * `data-testid="btn-reset-view"`
  * `data-testid="hex-board"`
* A test-friendly transform signal (e.g., `data-*` values) so tests can assert transform deltas without pixel-perfect checks.

### 5.2 Tests

* `e2e/client-web/board-viewport.spec.ts` (Playwright):
  * Load: lobby → create match → join → board renders, no console errors.
  * Fit-to-board: transform/bounds become “framed”.
  * Wheel zoom: scale changes in expected direction/range.
  * Drag pan: translation changes after pointer drag.
  * Reset: transform returns to baseline.

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (required if logic/state/resolver changes) — N/A expected.
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A expected.
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A expected.

---

## 6) Constraints (Hard)

* No engine logic changes; UI remains presentation-only.
* Tests must use stable selectors (`data-testid`) rather than CSS/layout-dependent selectors.
* E2E assertions avoid pixel-perfect positioning; prefer transform deltas and “bounds are inside viewport” checks.

---

## 7) Invariants (Must remain true)

* Client does not compute legality/costs/majority/modifiers.
* Determinism requirements for engine remain unaffected (no changes in `packages/game`).
* Repo stays clean (no Playwright output directories committed).

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Step 1: Add Playwright dependency and root `pnpm` scripts for E2E.
* [ ] Step 2: Add Playwright config that starts server + client as `webServer`.
* [ ] Step 3: Add stable `data-testid` hooks to viewport + controls + board root.
* [ ] Step 4: Add Playwright E2E tests for camera behaviors (load/fit/zoom/pan/reset).
* [ ] Step 5: Ignore Playwright artifacts (`playwright-report`, `test-results`) via `.gitignore`.
* [ ] Step 6: (Optional) Wire E2E into CI on `windows-latest`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `pnpm -w e2e` runs Playwright headless and passes on Windows.
* [ ] E2E uses only stable `data-testid` selectors for camera/viewport actions.
* [ ] Fit/zoom/pan/reset tests assert transform changes (not pixel-perfect snapshots).
* [ ] `pnpm lint` passes.
* [ ] `pnpm test` (or `pnpm vitest run`) passes.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Add Playwright E2E runner at workspace root with `playwright.config.ts` and `pnpm e2e` scripts that boot server + client.
* Add stable `data-testid` hooks for viewport + fit/reset controls + `hex-board`, plus a `data-*` transform signal for robust assertions.
* Add Playwright E2E acceptance test for camera: load/no-console-errors, fit, wheel zoom, drag pan, reset.
* Ignore Playwright artifacts (`playwright-report/`, `test-results/`) via `.gitignore`.
* Add `windows-latest` CI job that installs Chromium and runs `pnpm -w e2e`.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm test` → ok
* `pnpm exec playwright install chromium` → ok
* `pnpm e2e` → ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```text
On branch task/0052-client-web-playwright-e2e-board-viewport
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   .github/workflows/ci.yml
	modified:   .gitignore
	modified:   package.json
	modified:   packages/client-web/src/components/BoardViewport.tsx
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/src/index.css
	modified:   pnpm-lock.yaml

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/tasks/0052-client-web-playwright-e2e-board-viewport.md
	e2e/
	playwright.config.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```text
 .github/workflows/ci.yml                           | 44 +++++++++++++++++++++
 .gitignore                                         |  4 ++
 package.json                                       |  8 +++-
 .../client-web/src/components/BoardViewport.tsx    | 32 +++++++++++++--
 packages/client-web/src/components/HexBoard.tsx    |  2 +-
 packages/client-web/src/index.css                  |  8 +++-
 pnpm-lock.yaml                                     | 45 ++++++++++++++++++++--
 7 files changed, 133 insertions(+), 10 deletions(-)
```

### 13.3 Tests

```text
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/game[39m
packages/game test:  [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 64[2mms[22m[39m
packages/game test: [90mstdout[2m | test/setup.test.ts[2m > [22m[2mSetupGame[2m > [22m[2mshould not apply ex01 setup when ex01 flag is disabled[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: [90mstdout[2m | test/setup.test.ts[2m > [22m[2mSetupGame[2m > [22m[2mshould apply ex01 setup when enabled and keep deterministic deck composition[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  [32m✓[39m test/setup.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[90m 25[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-02 CONTROLLER grants[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-02 effect path[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/exp02-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 10[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-03 CONTROLLER grants[22m[39m
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-03 effect path[22m[39m
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  [32m✓[39m test/exp03-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[33m 2192[2mms[22m[39m
packages/game test:  [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[33m 2196[2mms[22m[39m
packages/game test:  [32m✓[39m test/resolver.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 18[2mms[22m[39m
packages/game test: [90mstderr[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould not mutate state when resource.pay cannot be fully paid[22m[39m
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: [90mstdout[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould apply production modifiers (no PingPong production reduction)[22m[39m
packages/game test: Expansion registered: PingPongModExp
packages/game test:  [32m✓[39m test/convert-resources-real-setup.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 19[2mms[22m[39m
packages/game test:  [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 21[2mms[22m[39m
packages/game test:  [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 27[2mms[22m[39m
packages/game test: [90mstderr[2m | test/moves.test.ts[2m > [22m[2mMoves[2m > [22m[2mplaceInfluence should reject malformed payload without mutation[22m[39m
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 31[2mms[22m[39m
packages/game test:  [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 56[2mms[22m[39m
packages/game test:  [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 40[2mms[22m[39m
packages/game test:  [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[90m 124[2mms[22m[39m
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject placeTile during politicalAction stage without mutation[22m[39m
packages/game test: ERROR: disallowed move: placeTile
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject passTilePlacement when a staging tile exists[22m[39m
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould end only after round settlement when draw pile empties mid-round[22m[39m
packages/game test: ERROR: disallowed move: pass
packages/game test: [90mstderr[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_hotspot_convert_pingpong[22m[39m
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: [90mstdout[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_plus_ex01_small[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/golden-replay.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 219[2mms[22m[39m
packages/game test:  [32m✓[39m test/computeMajorirty.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 9[2mms[22m[39m
packages/game test:  [32m✓[39m test/exp01-controller-grants-no-throw.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 12[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp01-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-01 controller grants with no controller[2m > [22m[2mshould not throw and should SKIP grant when controller is missing[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: [90mstdout[2m | test/expansion.test.ts[2m > [22m[2mExpansion System[2m > [22m[2mshould register an expansion[22m[39m
packages/game test: Expansion registered: TestExp
packages/game test: [90mstdout[2m | test/expansion.test.ts[2m > [22m[2mExpansion System[2m > [22m[2mshould apply production modifiers[22m[39m
packages/game test: Expansion registered: ModExp
packages/game test:  [32m✓[39m test/expansion.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 8[2mms[22m[39m
packages/game test:  [32m✓[39m test/controller-fallback-hardening.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 13[2mms[22m[39m
packages/game test:  [32m✓[39m test/tripwire-controller-grants-policy.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 293[2mms[22m[39m
packages/game test:  [32m✓[39m test/player-view.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 6[2mms[22m[39m
packages/game test:  [32m✓[39m test/exp02-hotspot-ids.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 4[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-hotspot-ids.test.ts[2m > [22m[2mEXP-02 Inner Order hotspot id consistency[2m > [22m[2mshould resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/production-uncontrolled.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
packages/game test: [2m Test Files [22m [1m[32m22 passed[39m[22m[90m (22)[39m
packages/game test: [2m      Tests [22m [1m[32m88 passed[39m[22m[90m (88)[39m
packages/game test: [2m   Start at [22m 17:29:46
packages/game test: [2m   Duration [22m 5.05s[2m (transform 4.53s, setup 3ms, collect 28.91s, tests 5.39s, environment 6ms, prepare 5.94s)[22m
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m
packages/client-web test:  [32m✓[39m test/fitToBounds.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/hexLayout.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/controls-start-committee.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 32[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/action-panel.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 63[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/Board.test.tsx [2m ([22m[2m7 tests[22m[2m)[22m[90m 74[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/pending-choice-modal.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 87[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/selection-inspector.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 93[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-screen.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 139[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-session-persistence.test.tsx [2m ([22m[2m4 tests[22m[2m)[22m[90m 141[2mms[22m[39m
packages/client-web test: [2m Test Files [22m [1m[32m9 passed[39m[22m[90m (9)[39m
packages/client-web test: [2m      Tests [22m [1m[32m28 passed[39m[22m[90m (28)[39m
packages/client-web test: [2m   Start at [22m 17:29:52
packages/client-web test: [2m   Duration [22m 3.35s[2m (transform 873ms, setup 2ms, collect 4.51s, tests 637ms, environment 14.27s, prepare 1.66s)[22m
packages/client-web test: Done

Removing unused browser at C:\Users\rewir\AppData\Local\ms-playwright\chromium-1193
Removing unused browser at C:\Users\rewir\AppData\Local\ms-playwright\chromium_headless_shell-1193
Removing unused browser at C:\Users\rewir\AppData\Local\ms-playwright\firefox-1490
Removing unused browser at C:\Users\rewir\AppData\Local\ms-playwright\webkit-2203
Downloading Chrome for Testing 145.0.7632.6 (playwright chromium v1208) from https://cdn.playwright.dev/builds/cft/145.0.7632.6/win64/chrome-win64.zip
Chrome for Testing 145.0.7632.6 (playwright chromium v1208) downloaded to C:\Users\rewir\AppData\Local\ms-playwright\chromium-1208
Downloading Chrome Headless Shell 145.0.7632.6 (playwright chromium-headless-shell v1208) from https://cdn.playwright.dev/builds/cft/145.0.7632.6/win64/chrome-headless-shell-win64.zip
Chrome Headless Shell 145.0.7632.6 (playwright chromium-headless-shell v1208) downloaded to C:\Users\rewir\AppData\Local\ms-playwright\chromium_headless_shell-1208

> balance-control-monorepo@0.0.0 e2e D:\__DEV\balance_control-anitgravity
> playwright test

Running 1 test using 1 worker

  ok 1 [chromium] › e2e\\client-web\\board-viewport.spec.ts:26:5 › board viewport: load + fit/zoom/pan/reset (2.6s)

  1 passed (8.4s)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Sun Feb 15 17:52:22 2026 +0100

    task(0052): add Playwright E2E for board viewport

- Add Playwright config and pnpm scripts to boot server + client.
- Add stable camera test hooks (data-testid + data-* transform).
- Add E2E camera spec covering fit/zoom/pan/reset and console-error smoke.
- Run E2E in CI on windows-latest.

 .github/workflows/ci.yml                           |  44 +++
 .gitignore                                         |   4 +
 ...052-client-web-playwright-e2e-board-viewport.md | 408 +++++++++++++++++++++
 e2e/client-web/board-viewport.spec.ts              | 158 ++++++++
 package.json                                       |   8 +-
 .../client-web/src/components/BoardViewport.tsx    |  32 +-
 packages/client-web/src/components/HexBoard.tsx    |   2 +-
 packages/client-web/src/index.css                  |   8 +-
 playwright.config.ts                               |  33 ++
 pnpm-lock.yaml                                     |  45 ++-
 10 files changed, 732 insertions(+), 10 deletions(-)
```

---

## 15) Amendments (append-only)

N/A
