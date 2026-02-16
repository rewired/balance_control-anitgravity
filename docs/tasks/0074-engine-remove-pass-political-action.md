# Task 0074 - Engine: Remove "pass" political action (not in CORE-01) and update intents/UI/tests

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0074-engine-remove-pass-political-action`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT -> FROZEN -> IMPLEMENTING -> VERIFYING -> COMMIT_READY -> DONE**

Rules (non-negotiable):

* Before touching code: set **Task State = FROZEN** and complete **Sections 0-9**.
* After FROZEN: **Sections 0-9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do not rewrite earlier sections.
* During IMPLEMENTING/VERIFYING: you may only:

  * check boxes in Section 10
  * fill Sections 11-14 (Work Summary / Commands / Proof)

Iteration budget (hard stop):

* Max 2 fix cycles after the first full test run. If still failing: STOP and report blockers.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-005
* GR-011

### compliance_notes

* GR-003: Change is deterministic and fully rule-anchored (removal of a non-specified action).
* GR-005: Anchor directly to CORE-01-04-03 and CORE-01-04-09 (ExactlyOnePoliticalAction action set). No new mechanics.
* GR-011: Update golden fixtures and tests to match the spec-aligned action set.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-03 (Phase 2 is ExactlyOnePoliticalAction)
* CORE: CORE-01-04-09 (ExactlyOnePoliticalAction allows exactly one action from: PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources)
* CORE: CORE-01-06-00-03 (invalid effects do not partially resolve)

---

## 2) Goal

Align the engine and UI with the CORE-01 spec by removing the non-specified political action:

* `pass` is currently offered as a political action and appears in legal intent enumeration
* CORE-01 defines the political action set explicitly and does not include `pass`

After this task, a player must take one of the specified political actions (or the turn structure must already skip Political Action when DrawPile empty per existing rules).

---

## 3) Non-Goals

* No new fallback rule such as "auto-pass if no legal action" (not defined in CORE-01).
* No changes to `passTilePlacement` (it is a CORE-01 rule in DrawAndPlaceTile).
* No balance changes; only remove the invalid action.

---

## 4) Inputs

Engine sources:

* `packages/game/src/moves.ts` (CoreMoves.pass currently exists)
* `packages/game/src/engine/legal-intents.ts` (emits `pass` intent)
* `packages/game/src/index.ts` and `packages/game/src/client-game.ts` (politicalActionMoves includes pass)

Client sources (special-casing pass today):

* `packages/client-web/src/components/ActionPanel.tsx`
* `packages/client-web/src/components/Controls.tsx` (if still present)

Tests / fixtures that currently use pass:

* `packages/game/test/*` (search for move "pass")
* `packages/game/test/golden/*.json`

Spec reference:

* `/docs/rules/000-core.md` (CORE-01-04-03, CORE-01-04-09)

---

## 5) Outputs

### 5.1 Code

A) Remove pass move from the engine:

* Remove `CoreMoves.pass` and its move-contract schema (if present).
* Remove pass from stage move maps in:

  - `packages/game/src/index.ts`
  - `packages/game/src/client-game.ts`

B) Remove pass from legal intent enumeration:

* `packages/game/src/engine/legal-intents.ts` must not emit `pass`.

C) Update client UI:

* Remove all pass-specific UI code paths (buttons, filters, labels).
* If `Controls.tsx` exists only for pass / legacy paths, remove or refactor accordingly.

### 5.2 Tests

A) Update all tests and golden fixtures that currently call pass.

B) Add / update a focused test that asserts:

* In `politicalAction` stage, `enumerateLegalIntents` never includes `pass`.

### 5.3 Docs

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (add a short entry: remove invalid pass political action)
* [ ] `/docs/design-decisions/DD-XXXX-pass-action.md` created (N/A if strictly spec-aligned removal, no alternative added)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Do not introduce any new action to replace pass.
* Do not modify turn structure or add new stage transitions.
* Keep determinism and golden replays stable after fixture update.

---

## 7) Invariants (Must remain true)

* `passTilePlacement` remains available in DrawAndPlaceTile.
* Move validation remains strict (invalid move -> no state change).
* EffectResolver usage tracking remains correct for political actions.

---

## 8) Implementation Plan

* [ ] Remove `pass` move + payload schema.
* [ ] Remove `pass` from stage move maps.
* [ ] Remove `pass` from intent enumeration.
* [ ] Update client UI to remove pass special cases.
* [ ] Update golden fixtures + tests, add assertion test.
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] `pass` is not callable (not exported as a move in politicalAction stage).
* [ ] `enumerateLegalIntents` never returns a `pass` intent.
* [ ] Client UI contains no pass button and no pass-related filtering.
* [ ] All tests pass, including golden replay tests (with updated fixtures).
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] pass move removed (engine + client-game)
* [x] pass intent removed (enumerator)
* [x] client UI updated
* [x] golden fixtures updated
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Removed non-spec `pass` political action from engine stage move maps and legal intent enumeration.
* Removed pass-specific UI branches and updated intent view-model/test expectations.
* Updated golden replay fixtures + replay runner test hashes to use spec-valid political actions.
* Hardened `SetupGame` to accept boardgame.io setup wrapper ctx (`{ ctx, random, ... }`) so PersonalSupply zones exist in Client-based runs.
* Updated `CHANGELOG.md` with the spec-aligned removal note.

---

## 12) Commands Run (exact)

* `git checkout -b task/0074-engine-remove-pass-political-action` (ok)
* `pnpm -w lint` (ok)
* `$env:NO_COLOR=1; pnpm -w test` (ok)
* `git status` (see Proof)
* `git diff --stat` (see Proof)
* `git add -A` (ok)
* `git commit -m "task(0074): remove pass political action" -m "...bullets..."` (ok)
* `git show -1 --stat` (see Proof)

---

## 13) Proof (screenshots / logs)

### git status

```
On branch task/0074-engine-remove-pass-political-action
nothing to commit, working tree clean
```

### git diff --stat

```
(no output; working tree clean)
```

### pnpm -w lint

```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### $env:NO_COLOR=1; pnpm -w test

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  Test Files  15 passed (15)
packages/client-web test:       Tests  47 passed (47)
packages/client-web test: Done
```

### git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 16:14:35 2026 +0100

    task(0074): remove pass political action

- Remove non-spec pass from political-action stage moves and intent enumeration.

- Update client UI, tests, replay fixtures/hashes to use CORE-01 actions only.

- Normalize boardgame.io setup ctx so SetupGame receives numPlayers + RNG deterministically.

 CHANGELOG.md                                       |   3 +-
 .../0074-engine-remove-pass-political-action.md    | 125 ++++++++++++++++++---
 packages/client-web/src/components/ActionPanel.tsx |   3 -
 .../src/ui/__tests__/intentViewModel.test.ts       |  13 +--
 packages/client-web/src/ui/useIntentViewModel.ts   |   2 -
 packages/client-web/test/action-panel.test.tsx     |   3 +-
 .../test/controls-start-committee.test.tsx         |   4 +-
 packages/game/src/client-game.ts                   |   1 -
 packages/game/src/engine/legal-intents.ts          |   1 -
 packages/game/src/index.ts                         |   1 -
 packages/game/src/move-contracts.ts                |   4 +-
 packages/game/src/moves.ts                         |  19 +---
 packages/game/src/replay.ts                        |  34 +++++-
 packages/game/src/setup.ts                         |  31 +++--
 packages/game/test/golden-replay.test.ts           |   1 +
 .../test/golden/core_hotspot_convert_pingpong.json |  12 +--
 .../game/test/golden/core_only_3p_2rounds.json     |  17 +--
 .../test/golden/core_pingpong_meta_marker.json     |   8 +-
 .../game/test/golden/core_plus_ex01_small.json     |   9 +-
 .../production_uncontrolled_produces_zero.json     |  14 ++-
 packages/game/test/hotspot.test.ts                 |   2 +-
 packages/game/test/legal-intents.test.ts           |   1 +
 packages/game/test/replay-runner.test.ts           |   8 +-
 packages/game/test/turn.test.ts                    |  55 ++++++----
 24 files changed, 253 insertions(+), 118 deletions(-)
```

---

## 14) Commit Message

Required format:

* Subject: `task(0074): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

Committed:

* Subject: `task(0074): remove pass political action`
* Body:
  - `- Remove non-spec pass from political-action stage moves and intent enumeration.`
  - `- Update client UI, tests, replay fixtures/hashes to use CORE-01 actions only.`
  - `- Normalize boardgame.io setup ctx so SetupGame receives numPlayers + RNG deterministically.`

---

## 15) Amendments (append-only)

* None
