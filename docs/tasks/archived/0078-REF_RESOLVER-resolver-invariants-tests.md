# Codex Task 0078 - REF_RESOLVER: Resolver invariants tests (order, determinism, no-override)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`

## 0) Metadata (frozen)

- **Task ID:** 0078
- **Area:** Test hardening for upcoming refactors
- **Risk:** Low-medium (tests only, but must be stable and non-flaky)

## 1) Context (frozen)

We are about to modularize resolver dispatch and split `resolver.ts`.
Before moving code, we need tests that fail loudly if we break:

- deterministic ordering
- canonical resolution ordering (prohibition/cost/payment/modifiers/mutation)
- no-override rule for atom handlers

## 2) Goal (frozen)

Add a small suite of focused invariants tests that act as refactor tripwires:

- deterministic handler registration behavior (no override, stable order)
- stable effect-queue behavior across runs (where feasible)
- preserve golden replay expectations (existing test remains green)

Minimum additional tripwires:

- Disabled expansions register nothing (no modules, no deck providers, no handlers) when their flag is `false`
- Module ordering is exactly the canonical order list (not "accidentally stable")

## 3) Non-goals (frozen)

- No changes to production/cost logic in this task
- No changes to effect resolver implementation in this task (tests may require minimal test harness plumbing only)

## 4) Inputs (frozen)

- Existing tests under `packages/game/test/*` (including golden replay)
- Resolver pipeline references in `AGENTS.md` and architecture docs
- Any new module registry from Task 0002 (if already landed)

## 5) Outputs (frozen)

- New tests (Vitest) for:
  - duplicate atom handler registration fails
  - deterministic ordering does not depend on JS insertion order
  - disabled expansion registers nothing (flag=false)
  - module order equals canonical order list exactly
  - (optional) a small order proof for a representative hook path

## 6) Constraints (frozen)

- Tests must be deterministic and not depend on time, environment, or nondeterministic iteration
- Keep tests minimal and close to contract language (avoid overfitting to current code layout)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-007 (Effect CPU Resolution Order)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-03-MEASURE-CPU.md` (resolution order)
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-007, GR-012)
- AGENTS: 3.5, 3.6, 5.1-5.3

## 8) Acceptance Criteria (frozen)

- Invariant tests fail when:
  - duplicate registrations occur
  - ordering becomes nondeterministic
- All existing tests still pass

## 9) PR Checklist (frozen)

- [x] Added deterministic invariants tests (no-override + ordering)
- [x] Tests are stable (no flakiness)
- [x] Existing golden replay test remains green
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

- Added resolver invariants tripwire tests (canonical order, deterministic dispatch ordering, no-override conflict ordering).
- Added gating test to ensure disabled expansion flags contribute no EXP-only atom handlers.
- Added a deterministic effect-queue stability proof (identical initial state → identical final state).

### Commands Run

TBD

```bash
git status
```
```
On branch task/0078-resolver-invariants-tests
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0078-REF_RESOLVER-resolver-invariants-tests.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/test/resolver-invariants.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 docs/tasks/0078-REF_RESOLVER-resolver-invariants-tests.md | 12 ++++++++----
 1 file changed, 8 insertions(+), 4 deletions(-)
```

```bash
pushd packages/game
pnpm vitest run --reporter=basic --silent
popd
pushd packages/client-web
pnpm vitest run --reporter=basic --silent
popd
```
```

[7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/game[39m

 [32m✓[39m test/computeMajorirty.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 78[2mms[22m[39m
 [32m✓[39m test/setup.test.ts [2m ([22m[2m8 tests[22m[2m)[22m[90m 25[2mms[22m[39m
 [32m✓[39m test/exp03-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m test/resolver.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m6 tests[22m[2m)[22m[90m 20[2mms[22m[39m
 [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 24[2mms[22m[39m
 [32m✓[39m test/player-view.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 17[2mms[22m[39m
 [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 26[2mms[22m[39m
 [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 58[2mms[22m[39m
 [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 44[2mms[22m[39m
 [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[90m 153[2mms[22m[39m
 [32m✓[39m test/golden-replay.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 262[2mms[22m[39m
 [32m✓[39m test/exp01-controller-grants-no-throw.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 16[2mms[22m[39m
 [32m✓[39m test/resolver-invariants.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 14[2mms[22m[39m
 [32m✓[39m test/tripwire-controller-grants-policy.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 281[2mms[22m[39m
 [32m✓[39m test/exp02-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 15[2mms[22m[39m
 [32m✓[39m test/expansion.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 11[2mms[22m[39m
 [32m✓[39m test/convert-resources-real-setup.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 10[2mms[22m[39m
 [32m✓[39m test/controller-fallback-hardening.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m test/unplaceable-draw-redraw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 9[2mms[22m[39m
 [32m✓[39m test/exp02-hotspot-ids.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 5[2mms[22m[39m
 [32m✓[39m test/engine-module-registry.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 4[2mms[22m[39m
 [32m✓[39m test/production-uncontrolled.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m

[2m Test Files [22m [1m[32m25 passed[39m[22m[90m (25)[39m
[2m      Tests [22m [1m[32m98 passed[39m[22m[90m (98)[39m
[2m   Start at [22m 17:40:04
[2m   Duration [22m 5.00s[2m (transform 5.37s, setup 4ms, collect 35.13s, tests 1.13s, environment 8ms, prepare 5.77s)[22m


[7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m

 [32m✓[39m test/fitToBounds.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 6[2mms[22m[39m
 [32m✓[39m test/hexLayout.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 8[2mms[22m[39m
 [32m✓[39m src/ui/__tests__/intentViewModel.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 12[2mms[22m[39m
 [32m✓[39m test/controls-start-committee.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 44[2mms[22m[39m
 [32m✓[39m test/action-panel.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 81[2mms[22m[39m
 [32m✓[39m test/hotseat-shell.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 78[2mms[22m[39m
 [32m✓[39m test/Board.test.tsx [2m ([22m[2m7 tests[22m[2m)[22m[90m 77[2mms[22m[39m
 [32m✓[39m test/drawpile-and-discard-ui.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 92[2mms[22m[39m
 [32m✓[39m test/public-notice-unplaceable.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 121[2mms[22m[39m
 [32m✓[39m test/pending-choice-modal.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 138[2mms[22m[39m
 [32m✓[39m test/selection-inspector.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 153[2mms[22m[39m
 [32m✓[39m test/lobby-session-persistence.test.tsx [2m ([22m[2m4 tests[22m[2m)[22m[90m 250[2mms[22m[39m
 [32m✓[39m src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx [2m ([22m[2m9 tests[22m[2m)[22m[90m 141[2mms[22m[39m
 [32m✓[39m test/lobby-screen.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 254[2mms[22m[39m
 [32m✓[39m test/start-flow-mode-select.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 135[2mms[22m[39m
 [32m✓[39m test/no-game-src-imports.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 8[2mms[22m[39m

[2m Test Files [22m [1m[32m16 passed[39m[22m[90m (16)[39m
[2m      Tests [22m [1m[32m48 passed[39m[22m[90m (48)[39m
[2m   Start at [22m 17:40:10
[2m   Duration [22m 4.56s[2m (transform 936ms, setup 3ms, collect 11.02s, tests 1.60s, environment 33.09s, prepare 4.02s)[22m
```

```bash
pnpm lint
```
```

> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

```bash
git status
```
```
On branch task/0078-resolver-invariants-tests
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0078-REF_RESOLVER-resolver-invariants-tests.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/test/resolver-invariants.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 .../0078-REF_RESOLVER-resolver-invariants-tests.md | 115 ++++++++++++++++++++-
 1 file changed, 111 insertions(+), 4 deletions(-)
```

```bash
git show -1 --stat
```
```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 17:43:29 2026 +0100

    task(0078): add resolver invariants tests

- Add tripwire tests for module order and conflict ordering.

- Add gating tests for disabled expansion atom handlers.

- Add effect-queue stability proof to catch nondeterminism.

- Update task log with commands and proofs.

 .../0078-REF_RESOLVER-resolver-invariants-tests.md | 140 ++++++++++++++-
 packages/game/test/resolver-invariants.test.ts     | 196 +++++++++++++++++++++
 2 files changed, 332 insertions(+), 4 deletions(-)
```
