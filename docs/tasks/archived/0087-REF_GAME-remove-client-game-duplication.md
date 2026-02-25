# Codex Task 0087 - REF_GAME: Remove client/server game-definition divergence

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0087
- **Area:** `packages/game` exports + `packages/client-web` module wiring
- **Recommended execution order:** do before any larger engine refactors that assume one canonical Game definition
- **Risk:** Medium (wiring change can surface hidden reliance on stale client-game behavior)

## 1) Context (frozen)

Right now the web client does **not** use the same `BalanceControl` Game definition as the rest of the repo.

- Server + tests import `packages/game/src/index.ts` (`export const BalanceControl ...`)
- Client (`packages/client-web`) aliases `@balance-control/game` to `packages/game/src/client-game.ts` via Vite.
- `client-game.ts` contains a *second* `BalanceControl` implementation that has drifted from `index.ts` (missing/older round-start and production ordering logic, different onEnd behavior, etc.).

This is dangerous:
- Hotseat / local-client execution can diverge from server-authoritative behavior.
- Golden replays and determinism are harder to trust because there are effectively two rules engines.

## 2) Goal (frozen)

- Ensure **exactly one** canonical `BalanceControl` Game definition is used across:
  - `packages/server`
  - `packages/client-web` (including hotseat)
  - `packages/bot-llm`
  - `packages/game` tests
- Eliminate the duplicated/stale Game definition in `client-game.ts`.

## 3) Non-goals (frozen)

- Do not redesign turn structure, rules, or resolver logic.
- Do not change gameplay behavior intentionally.
- Do not rework bundling beyond what is required to point the client at the canonical file.

## 4) Inputs (frozen)

- `packages/game/src/index.ts` (canonical Game definition)
- `packages/game/src/client-game.ts` (duplicated/stale Game definition)
- `packages/client-web/vite.config.ts` (aliases `@balance-control/game` → `client-game.ts`)
- Client entry points importing `BalanceControl`:
  - `packages/client-web/src/App.tsx`
  - `packages/client-web/src/hotseat/HotseatShell.tsx`
  - `packages/client-web/src/components/LobbyScreen.tsx`

## 5) Outputs (frozen)

### Code

- [ ] Update `packages/client-web/vite.config.ts` alias so `@balance-control/game` resolves to **the canonical** source (`../game/src/index.ts`) for dev builds.
- [ ] Remove duplication:
  - either delete `packages/game/src/client-game.ts`, **or**
  - replace it with a thin re-export barrel that forwards everything from `./index` (no duplicated logic).

### Tests

- [ ] `pnpm -r test` passes (at least `packages/game` and `packages/client-web`).
- [ ] If any client-only tests exist, ensure they still pass under the updated alias.

## 6) Constraints (frozen)

- Engine authority remains in `packages/game` (client stays presentation-only).
- Determinism must not regress (golden replays remain valid).
- No silent logic changes: any behavior change must be treated as a bugfix and justified by existing spec text.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-002 (Engine-only Rule Execution)
- GR-003 (Determinism Contract)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-002, GR-003)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (client is presentation-only; engine authority)

## 8) Acceptance Criteria (frozen)

- [ ] Client builds and runs using the same `BalanceControl` definition as server/tests.
- [ ] There is no second/stale copy of the Game object logic in the repo.
- [ ] Golden replay tests remain unchanged (unless a prior client-only divergence is now fixed; then document why).

## 9) PR Checklist (frozen)

- [x] Client alias points at canonical game source
- [x] Duplicated game-definition code removed or converted to pure re-export
- [x] No intentional behavior changes
- [x] Tests pass (`pnpm -r test`)
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Point `@balance-control/game` Vite alias at canonical `packages/game/src/index.ts`.
- Convert `packages/game/src/client-game.ts` to a thin re-export barrel to eliminate duplicated/stale Game logic.
- Confirm client and game tests pass under the new alias.

### Commands Run

- `git status` (ok; see Postflight Proof)
- `git diff --stat` (ok; see Postflight Proof)
- `pnpm -r test` (ok; see Postflight Proof)
- `$env:NO_COLOR=1; pnpm -r test` (ok; see Postflight Proof)
- `git show -1 --stat` (ok; see Postflight Proof)
- `git status` (post-commit clean; see Postflight Proof)

### Postflight Proof

- `git status`
  ```
  On branch task/0087-ref-game-remove-client-duplication
  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
  	modified:   packages/client-web/vite.config.ts
  	modified:   packages/game/src/client-game.ts
  
  no changes added to commit (use "git add" and/or "git commit -a")
  ```
- `git diff --stat`
  ```
   packages/client-web/vite.config.ts |   2 +-
   packages/game/src/client-game.ts   | 185 +------------------------------------
   2 files changed, 2 insertions(+), 185 deletions(-)
  ```
- `pnpm -r test`
  ```
  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  packages/game test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/game[39m
  packages/game test:  [32m✓[39m test/spec-anchor-tripwire.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 81[2mms[22m[39m
  packages/game test:  [32m✓[39m test/computeMajority.test.ts [2m ([22m[2m5 tests[22m[2m)[22m[90m 11[2mms[22m[39m
  packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mroutes EXP-02 measure object ids to the EXP-02 measure zones[22m[39m
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: EXP-02 Setup Complete.
  packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mroutes EXP-03 measure object ids to the EXP-03 measure zones[22m[39m
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mdoes not register disabled expansions as measure deck providers[22m[39m
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: [90mstdout[2m | test/measure-deck-provider.test.ts[2m > [22m[2mMeasure deck provider lookup[2m > [22m[2mfails deterministically when multiple enabled decks match the same object id[22m[39m
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  [32m✓[39m test/measure-deck-provider.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 15[2mms[22m[39m
  packages/game test:  [32m✓[39m test/exp03-controller-grants-no-throw.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 13[2mms[22m[39m
  packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould require explicit SKIP policy on all EXP-03 CONTROLLER grants[22m[39m
  packages/game test: Expansion registered: exp03
  packages/game test: [90mstdout[2m | test/exp03-controller-grants-no-throw.test.ts[2m > [22m[2mEXP-03 controller grants with no controller[2m > [22m[2mshould not throw and should not grant to Noise for uncontrolled EXP-03 effect path[22m[39m
  packages/game test: Expansion registered: exp03
  packages/game test:  [32m✓[39m test/determinism-policy.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 24[2mms[22m[39m
  packages/game test:  [32m✓[39m test/convert-resources-real-setup.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 19[2mms[22m[39m
  packages/game test:  [32m✓[39m test/legal-intents.test.ts [2m ([22m[2m7 tests[22m[2m)[22m[90m 70[2mms[22m[39m
  packages/game test:  [32m✓[39m test/hotspot.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 67[2mms[22m[39m
  packages/game test: [90mstderr[2m | test/moves.test.ts[2m > [22m[2mMoves[2m > [22m[2mplaceInfluence should reject malformed payload without mutation[22m[39m
  packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
  packages/game test:  [32m✓[39m test/moves.test.ts [2m ([22m[2m22 tests[22m[2m)[22m[90m 92[2mms[22m[39m
  packages/game test:  [32m✓[39m test/player-view.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 27[2mms[22m[39m
  packages/game test:  [32m✓[39m test/server-smoke.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 76[2mms[22m[39m
  packages/game test:  [32m✓[39m test/replay-runner.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 122[2mms[22m[39m
  packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject placeTile during politicalAction stage without mutation[22m[39m
  packages/game test: ERROR: disallowed move: placeTile
  packages/game test: [90mstderr[2m | test/turn.test.ts[2m > [22m[2mTurn Structure (Stages)[2m > [22m[2mshould reject passTilePlacement when a staging tile exists[22m[39m
  packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
  packages/game test:  [32m✓[39m test/turn.test.ts [2m ([22m[2m9 tests[22m[2m)[22m[33m 309[2mms[22m[39m
  packages/game test: [90mstderr[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_hotspot_convert_pingpong[22m[39m
  packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
  packages/game test: [90mstdout[2m | test/golden-replay.test.ts[2m > [22m[2mGolden replays[2m > [22m[2mshould match golden hash for core_plus_ex01_small[22m[39m
  packages/game test: Expansio…4067 chars truncated…2m[2mshould return expansions in deterministic canonical order[22m[39m
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: Expansion registered: exp02
  packages/game test: [90mstdout[2m | test/expansion.test.ts[2m > [22m[2mExpansion System[2m > [22m[2mshould apply production modifiers[22m[39m
  packages/game test: Expansion registered: exp01
  packages/game test:  [32m✓[39m test/move-assembly-invariants.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 4[2mms[22m[39m
  packages/game test: [90mstdout[2m | test/move-assembly-invariants.test.ts[2m > [22m[2mMove assembly invariants[2m > [22m[2mdisabled expansion contributes no move modules[22m[39m
  packages/game test: Expansion registered: exp01
  packages/game test: [90mstdout[2m | test/move-assembly-invariants.test.ts[2m > [22m[2mMove assembly invariants[2m > [22m[2mmodule ordering equals canonical order filtered by enablement (independent of registration order)[22m[39m
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: [90mstdout[2m | test/move-assembly-invariants.test.ts[2m > [22m[2mMove assembly invariants[2m > [22m[2mduplicate move keys fail deterministically[22m[39m
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp01
  packages/game test:  [32m✓[39m test/engine-module-registry.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 4[2mms[22m[39m
  packages/game test:  [32m✓[39m test/move-module-registry.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
  packages/game test:  [32m✓[39m test/production-uncontrolled.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 3[2mms[22m[39m
  packages/game test: [2m Test Files [22m [1m[32m28 passed[39m[22m[90m (28)[39m
  packages/game test: [2m      Tests [22m [1m[32m107 passed[39m[22m[90m (107)[39m
  packages/game test: [2m   Start at [22m 06:01:02
  packages/game test: [2m   Duration [22m 5.53s[2m (transform 4.40s, setup 4ms, collect 37.44s, tests 2.27s, environment 8ms, prepare 7.58s)[22m
  packages/game test: Done
  packages/client-web test$ vitest run
  packages/client-web test: [7m[1m[36m RUN [39m[22m[27m [36mv0.30.1[39m [90mD:/__DEV/balance_control-anitgravity/packages/client-web[39m
  packages/client-web test:  [32m✓[39m test/fitToBounds.test.ts [2m ([22m[2m3 tests[22m[2m)[22m[90m 7[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/hexLayout.test.ts [2m ([22m[2m2 tests[22m[2m)[22m[90m 6[2mms[22m[39m
  packages/client-web test:  [32m✓[39m src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx [2m ([22m[2m9 tests[22m[2m)[22m[90m 109[2mms[22m[39m
  packages/client-web test:  [32m✓[39m src/ui/__tests__/intentViewModel.test.ts [2m ([22m[2m4 tests[22m[2m)[22m[90m 6[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/controls-start-committee.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 45[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/action-panel.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 57[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/hotseat-shell.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 66[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/Board.test.tsx [2m ([22m[2m7 tests[22m[2m)[22m[90m 78[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/drawpile-and-discard-ui.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 90[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/start-flow-mode-select.smoke.test.tsx [2m ([22m[2m1 test[22m[2m)[22m[90m 136[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/pending-choice-modal.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 111[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/selection-inspector.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 133[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/public-notice-unplaceable.test.tsx [2m ([22m[2m2 tests[22m[2m)[22m[90m 112[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/lobby-screen.test.tsx [2m ([22m[2m3 tests[22m[2m)[22m[90m 213[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/lobby-session-persistence.test.tsx [2m ([22m[2m4 tests[22m[2m)[22m[90m 220[2mms[22m[39m
  packages/client-web test:  [32m✓[39m test/no-game-src-imports.test.ts [2m ([22m[2m1 test[22m[2m)[22m[90m 7[2mms[22m[39m
  packages/client-web test: [2m Test Files [22m [1m[32m16 passed[39m[22m[90m (16)[39m
  packages/client-web test: [2m      Tests [22m [1m[32m48 passed[39m[22m[90m (48)[39m
  packages/client-web test: [2m   Start at [22m 06:01:09
  packages/client-web test: [2m   Duration [22m 5.01s[2m (transform 1.17s, setup 1ms, collect 13.83s, tests 1.40s, environment 34.98s, prepare 4.17s)[22m
  packages/client-web test: Done
  ```
- `$env:NO_COLOR=1; pnpm -r test`
  ```
  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
  packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
  packages/game test: Expansion registered: exp01
  packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
  packages/game test: Expansion registered: exp01
  packages/game test:  ✓ test/setup.test.ts  (8 tests) 26ms
  packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 100ms
  packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
  packages/game test: Expansion registered: exp02
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 8ms
  packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 13ms
  packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
  packages/game test: Expansion registered: exp01
  packages/game test: EXP-01 Setup Complete.
  packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 25ms
  packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 15ms
  packages/game test:  ✓ test/legal-intents.test.ts  (7 tests) 30ms
  packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 34ms
  packages/game test:  ✓ test/moves.test.ts  (22 tests) 43ms
  packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
  packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
  packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 19ms
  packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-02 measure object ids to the EXP-02 measure zones
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: EXP-02 Setup Complete.
  packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-03 measure object ids to the EXP-03 measure zones
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > does not register disabled expansions as measure deck providers
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > fails deterministically when multiple enabled decks match the same object id
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/player-view.test.ts  (3 tests) 48ms
  packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 57ms
  packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 77ms
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
  packages/game test: ERROR: disallowed move: placeTile
  packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
  packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
  packages/game test:  ✓ test/turn.test.ts  (9 tests) 246ms
  packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 588ms
  packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
  packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
  packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
  packages/game test: Expansion registered: exp01
  packages/game test: EXP-01 Setup Complete.
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
  packages/game test: Expansion registered: exp02
  packages/game test: EXP-02 Setup Complete.
  packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
  packages/game test: Expansion registered: exp02
  packages/game test: EXP-02 Setup Complete.
  packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 13ms
  packages/ga…193 chars truncated…ler-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
  packages/game test: Expansion registered: exp03
  packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
  packages/game test: Expansion registered: exp03
  packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 464ms
  packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 6ms
  packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 3ms
  packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
  packages/game test: [resolver:resource.pay] insufficient resources for cost
  packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
  packages/game test: Expansion registered: exp01
  packages/game test:  ✓ test/resolver.test.ts  (6 tests) 15ms
  packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
  packages/game test:  ✓ test/expansion.test.ts  (3 tests) 8ms
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
  packages/game test: Expansion registered: exp01
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: Expansion registered: exp02
  packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
  packages/game test: Expansion registered: exp01
  packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 11ms
  packages/game test:  ✓ test/move-assembly-invariants.test.ts  (3 tests) 5ms
  packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > disabled expansion contributes no move modules
  packages/game test: Expansion registered: exp01
  packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > module ordering equals canonical order filtered by enablement (independent of registration order)
  packages/game test: Expansion registered: exp03
  packages/game test: Expansion registered: exp01
  packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > duplicate move keys fail deterministically
  packages/game test: Expansion registered: exp02
  packages/game test: Expansion registered: exp01
  packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 3ms
  packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
  packages/game test:  Test Files  28 passed (28)
  packages/game test:       Tests  107 passed (107)
  packages/game test:    Start at  06:03:53
  packages/game test:    Duration  5.45s (transform 3.97s, setup 5ms, collect 35.42s, tests 1.91s, environment 10ms, prepare 7.13s)
  packages/game test: Done
  packages/client-web test$ vitest run
  packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 9ms
  packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 8ms
  packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 120ms
  packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 8ms
  packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 43ms
  packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 60ms
  packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 54ms
  packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 91ms
  packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 101ms
  packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 154ms
  packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 141ms
  packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 238ms
  packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 242ms
  packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 116ms
  packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 134ms
  packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 7ms
  packages/client-web test:  Test Files  16 passed (16)
  packages/client-web test:       Tests  48 passed (48)
  packages/client-web test:    Start at  06:04:00
  packages/client-web test:    Duration  5.02s (transform 1.22s, setup 2ms, collect 14.11s, tests 1.53s, environment 35.84s, prepare 4.24s)
  packages/client-web test: Done
  ```
- `git show -1 --stat`
  ```
  Author: Björn Ahlers <rewired.de@gmail.com>
  Date:   Tue Feb 17 06:06:16 2026 +0100
  
      task(0087): remove client game divergence
  
  - Point client-web Vite alias @balance-control/game at canonical game/src/index.ts
  
  - Replace game/src/client-game.ts with a thin re-export to eliminate duplicated Game logic
  
  - Keep client/server/tests on a single authoritative rules engine
  
   ...0087-REF_GAME-remove-client-game-duplication.md | 256 ++++++++++++++++++++-
   packages/client-web/vite.config.ts                 |   2 +-
   packages/game/src/client-game.ts                   | 185 +--------------
   3 files changed, 250 insertions(+), 193 deletions(-)
  ```
- `git status` (post-commit)
  ```
  On branch task/0087-ref-game-remove-client-duplication
  nothing to commit, working tree clean
  ```
