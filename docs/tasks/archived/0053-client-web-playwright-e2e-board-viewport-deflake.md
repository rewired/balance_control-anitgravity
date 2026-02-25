# Task 0053 — Client-Web: De-flake Playwright E2E (Board Viewport)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0053-client-web-playwright-e2e-board-viewport-deflake`

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

* GR-002: E2E assertions and camera hooks remain presentation-only; no client-side legality/cost/majority/modifier logic is introduced.
* GR-005: No new engine moves/intents are introduced; changes are limited to UI camera behavior + tests.
* GR-014: No changes to tile/icon mapping; only stabilizes camera controls and E2E coverage.

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

* Remove accidental merge-conflict markers from the committed E2E + BoardViewport sources (repo must build/run).
* Make the board viewport camera E2E test non-flaky on Windows headless by using stable selectors and robust transform assertions.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not change engine rules, legality, state shape, or production logic.
* Do not add screenshot baselines (can be added later once UX is stable).

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/BoardViewport.tsx` (camera wrapper via `react-zoom-pan-pinch`)
  * `e2e/client-web/board-viewport.spec.ts` (Playwright E2E)
  * `playwright.config.ts` (webServer orchestration)
* Existing behavior summary (current):

  * Board viewport supports pan/zoom and fit/reset controls.
  * E2E currently fails / flakes (fit-to-board repeat + reset) and contains accidental merge markers that break parsing/build.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* Resolved `BoardViewport.tsx` without merge markers; camera controls excluded from pan/wheel capture.

### 5.2 Tests

* Resolved `board-viewport.spec.ts` without merge markers; deterministic lobby join + robust fit/zoom/pan/reset assertions.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — N/A
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Remove merge markers and keep hardened camera logic in `BoardViewport.tsx`.
* [ ] Remove merge markers and keep hardened E2E logic in `board-viewport.spec.ts`.
* [ ] Run `pnpm lint`, `pnpm test`, and `pnpm run e2e` (plus a small repeat run for flake detection).
* [ ] Update this task file sections 10–14 with proofs.
* [ ] Create exactly one commit on this branch.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Repo contains no merge-conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
* [ ] `pnpm run e2e` passes on Windows headless.
* [ ] `pnpm exec playwright test --repeat-each 5 --workers 1` passes (basic flake check).
* [ ] `pnpm lint` and `pnpm test` pass.

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

* Remove accidental merge-conflict markers from the committed E2E + BoardViewport sources.
* Make the camera E2E robust by asserting delta-to-baseline transform (`data-baseline-*`) instead of comparing two independent fit computations.
* Make lobby flow deterministic by joining the created match ID/seat (avoid “join the first match” races).
* De-flake zoom/pan assertions by waiting for viewport transforms to become idle before fit/reset checks.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` -> ok
* `pnpm test` -> ok
* `pnpm run e2e` -> ok
* `pnpm exec playwright test e2e/client-web/board-viewport.spec.ts --repeat-each 5 --workers 1` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```text
On branch task/0053-client-web-playwright-e2e-board-viewport-deflake
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   e2e/client-web/board-viewport.spec.ts
	modified:   packages/client-web/src/components/BoardViewport.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/tasks/0053-client-web-playwright-e2e-board-viewport-deflake.md

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```text
 e2e/client-web/board-viewport.spec.ts              | 121 ++++++---------------
 .../client-web/src/components/BoardViewport.tsx    |   5 -
 2 files changed, 36 insertions(+), 90 deletions(-)
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
packages/game test:  [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 53[2mms[22m[39m
packages/game test: [90mstdout[2m | test/setup.test.ts[2m > [22m[2mSetupGame[2m > [22m[2mshould not apply ex01 setup when ex01 flag is disabled[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: [90mstdout[2m | test/setup.test.ts[2m > [22m[2mSetupGame[2m > [22m[2mshould apply ex01 setup when enabled and keep deterministic deck composition[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  [32m✓[39m test/setup.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[90m 11[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-02 CONTROLLER grants[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/exp02-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-02 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-02 effect path[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  [32m✓[39m test/exp02-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 10[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp01-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-01 controller grants with no controller[2m > [22m[2mshould not throw and should SKIP grant when controller is missing[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: [90mstderr[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould not mutate state when resource.pay cannot be fully paid[22m[39m
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  [32m✓[39m test/exp01-controller-grants-no-throw.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 10[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-03 CONTROLLER grants[22m[39m
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-03 effect path[22m[39m
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  [32m✓[39m test/exp03-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 14[2mms[22m[39m
packages/game test: [90mstdout[2m | test/resolver.test.ts[2m > [22m[2mEffectResolver cost and production behavior[2m > [22m[2mshould apply production modifiers (no PingPong production reduction)[22m[39m
packages/game test: Expansion registered: PingPongModExp
packages/game test:  [32m✓[39m test/resolver.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 11[2mms[22m[39m
packages/game test:  [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 14[2mms[22m[39m
packages/game test:  [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 19[2mms[22m[39m
packages/game test:  [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 22[2mms[22m[39m
packages/game test:  [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 21[2mms[22m[39m
packages/game test: [90mstderr[2m | test/moves.test.ts[2m > [22m[2mMoves[2m > [22m[2mplaceInfluence should reject malformed payload without mutation[22m[39m
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 44[2mms[22m[39m
packages/game test:  [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 39[2mms[22m[39m
packages/game test:  [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[90m 86[2mms[22m[39m
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages…282 chars truncated…ePlacement when a staging tile exists[22m[39m
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould end only after round settlement when draw pile empties mid-round[22m[39m
packages/game test: ERROR: disallowed move: pass
packages/game test:  [32m✓[39m test/golden-replay.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 184[2mms[22m[39m
packages/game test: [90mstderr[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_hotspot_convert_pingpong[22m[39m
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: [90mstdout[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_plus_ex01_small[22m[39m
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  [32m✓[39m test/computeMajority.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/game test:  [32m✓[39m test/tripwire-controller-grants-policy.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 197[2mms[22m[39m
packages/game test:  [32m✓[39m test/convert-resources-real-setup.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 14[2mms[22m[39m
packages/game test:  [32m✓[39m test/controller-fallback-hardening.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
packages/game test:  [32m✓[39m test/exp02-hotspot-ids.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 6[2mms[22m[39m
packages/game test: [90mstdout[2m | test/exp02-hotspot-ids.test.ts[2m > [22m[2mEXP-02 Inner Order hotspot id consistency[2m > [22m[2mshould resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id[22m[39m
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: [90mstdout[2m | test/expansion.test.ts[2m > [22m[2mExpansion System[2m > [22m[2mshould register an expansion[22m[39m
packages/game test: Expansion registered: TestExp
packages/game test: [90mstdout[2m | test/expansion.test.ts[2m > [22m[2mExpansion System[2m > [22m[2mshould apply production modifiers[22m[39m
packages/game test: Expansion registered: ModExp
packages/game test:  [32m✓[39m test/expansion.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 6[2mms[22m[39m
packages/game test:  [32m✓[39m test/player-view.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/game test:  [32m✓[39m test/production-uncontrolled.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
packages/game test: [2m Test Files [22m [1m[32m22 passed[39m[22m[90m (22)[39m
packages/game test: [2m      Tests [22m [1m[32m88 passed[39m[22m[90m (88)[39m
packages/game test: [2m   Start at [22m 22:30:57
packages/game test: [2m   Duration [22m 4.41s[2m (transform 4.33s, setup 1ms, collect 21.80s, tests 777ms, environment 6ms, prepare 5.30s)[22m
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m
packages/client-web test:  [32m✓[39m test/hexLayout.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/fitToBounds.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/controls-start-committee.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 42[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/action-panel.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 68[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/Board.test.tsx [2m ([22m[2m7 tests[22m[2m)[22m[90m 61[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/pending-choice-modal.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 67[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/selection-inspector.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 78[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-screen.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 118[2mms[22m[39m
packages/client-web test:  [32m✓[39m test/lobby-session-persistence.test.tsx [2m ([22m[2m4 tests[22m[2m)[22m[90m 122[2mms[22m[39m
packages/client-web test: [2m Test Files [22m [1m[32m9 passed[39m[22m[90m (9)[39m
packages/client-web test: [2m      Tests [22m [1m[32m28 passed[39m[22m[90m (28)[39m
packages/client-web test: [2m   Start at [22m 22:31:03
packages/client-web test: [2m   Duration [22m 3.17s[2m (transform 842ms, setup 1ms, collect 4.09s, tests 564ms, environment 13.60s, prepare 1.74s)[22m
packages/client-web test: Done

> balance-control-monorepo@0.0.0 e2e D:\__DEV\balance_control-anitgravity
> playwright test


Running 1 test using 1 worker

  ok 1 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.6s)

  1 passed (10.1s)

Running 5 tests using 1 worker

  ok 1 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.5s)
  ok 2 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.5s)
  ok 3 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.6s)
  ok 4 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.5s)
  ok 5 [chromium] › e2e\\client-web\\board-viewport.spec.ts:92:5 › board viewport: load + fit/zoom/pan/reset (4.5s)

  5 passed (35.9s)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Sun Feb 15 22:38:44 2026 +0100

    task(0053): deflake board viewport e2e

- Remove accidental merge-conflict markers in viewport E2E + component
- Store fit baseline on the viewport and assert delta-to-baseline in E2E
- Join created lobby match deterministically to avoid race conditions
- Wait for viewport transforms to become idle before fit/reset assertions

 ...nt-web-playwright-e2e-board-viewport-deflake.md | 378 +++++++++++++++++++++
 e2e/client-web/board-viewport.spec.ts              | 121 ++-----
 .../client-web/src/components/BoardViewport.tsx    |   5 -
 3 files changed, 414 insertions(+), 90 deletions(-)
```

---

## 15) Amendments (append-only)

N/A
