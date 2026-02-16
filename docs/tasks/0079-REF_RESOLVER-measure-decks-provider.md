# Codex Task 0079 - REF_RESOLVER: Measure decks as provider modules (remove prefix switches)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`

## 0) Metadata (frozen)

- **Task ID:** 0079
- **Area:** Resolver modularization (measures)
- **Risk:** Medium (touches measure zone routing; must preserve zone invariants)

## 1) Context (frozen)

`packages/game/src/engine/resolver.ts` currently hardcodes measure zone routing via object id prefixes (e.g. `exp02_`, `exp03_`) in both measure take and play flows.
This duplicates logic and makes it harder to keep expansion isolation clean.

## 2) Goal (frozen)

Make core measure handling generic by introducing a "measure deck provider" concept:

- Core owns `measure.take`, `measure.play`, and `measure.recycle` semantics
- Expansions provide deck definitions (zone ids + object-id matching) via registration
- Resolver stops switching on string prefixes

Determinism requirements:

- If deck lookup is implemented as a scan, it must scan in canonical module order (never "first registered wins" via incidental side effects).
- If multiple deck providers match the same `measureObjectId`, fail deterministically with a stable error message.

## 3) Non-goals (frozen)

- No changes to measure rules or costs
- No changes to how expansions define measure atoms (`getMeasureAtoms`) beyond wiring
- No change to shuffle determinism or RNG usage

## 4) Inputs (frozen)

- `packages/game/src/engine/resolver.ts` (measure handlers)
- `packages/game/src/engine/types.ts` (measure atoms)
- `packages/expansion-02/src/index.ts`, `packages/expansion-03/src/index.ts` (measure zone names)
- Expansion enablement flags (canonical source from Task 0001)

## 5) Outputs (frozen)

- A measure deck definition interface (engine-layer)
- Registry lookup: `measureObjectId -> deck`
- Core measure handlers updated to use deck lookup
- Removal of prefix-based branching in core resolver
- Minimal tests proving deck lookup correctness for EXP-02 and EXP-03

## 6) Constraints (frozen)

- Must preserve zone invariants (one object in exactly one zone; no ghost expansion zones when disabled)
- Must preserve determinism (shuffles from seeded RNG only; stable ordering)
- Deck provider lookup must be deterministic and not depend on registration side effects
- When an expansion is disabled, its deck providers must not be registered; core measure handlers must not touch that expansion's zones at all (avoid even "exists? then ignore" patterns)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-009 (Zone Invariants)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-02-STATE-SHAPE.md` (zone model + expansion isolation)
- `docs/architecture/ARCH-03-MEASURE-CPU.md` (measure CPU semantics + pendingChoice stability)
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-009, GR-012)

## 8) Acceptance Criteria (frozen)

- No prefix-based measure zone routing remains in core resolver code
- EXP-02 and EXP-03 measure flows behave identically to before
- When an expansion is disabled, its measure deck is not registered and its zones are not touched
- Tests pass

## 9) PR Checklist (frozen)

- [x] Measure deck provider interface introduced
- [x] Deck lookup used by core measure handlers
- [x] Prefix switches removed from resolver
- [x] Expansion gating respected (disabled expansions do not contribute deck providers)
- [x] Tests cover deck lookup for EXP-02/EXP-03
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Introduced deterministic measure deck descriptors (`measureDecks`) on `ExpansionDefinition` and wired EXP-02 / EXP-03 decks.
- Added canonical provider scan + deterministic failure behavior via `lookupMeasureDeckForObjectId`.
- Refactored core `measure.take` / `measure.play` flows to use deck lookup (removed prefix switches).
- Refactored `takeMeasure` move validation to use the same deck lookup (no prefix routing).
- Added unit tests for routing, expansion gating, and deterministic conflict errors.
- Updated `CHANGELOG.md` entry for the refactor.

### Commands Run

```bash
git status
```
```
On branch task/0079-measure-decks-provider
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   packages/expansion-02/src/index.ts
	modified:   packages/expansion-03/src/index.ts
	modified:   packages/game/src/engine/resolver.ts
	modified:   packages/game/src/expansion-moves.ts
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/rules/src/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/engine/measure-deck-provider.ts
	packages/game/test/measure-deck-provider.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 CHANGELOG.md                            |  1 +
 packages/expansion-02/src/index.ts      | 12 +++++++++++
 packages/expansion-03/src/index.ts      | 12 +++++++++++
 packages/game/src/engine/resolver.ts    | 37 +++++++--------------------------
 packages/game/src/expansion-moves.ts    | 12 +++++++----
 packages/game/src/expansion-registry.ts | 21 ++++++++++++++++++-
 packages/rules/src/index.ts             | 20 ++++++++++++++++++
 7 files changed, 80 insertions(+), 35 deletions(-)
```

```bash
pnpm test
```
```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  Test Files  26 passed (26)
packages/game test:       Tests  102 passed (102)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test: Done
```

```bash
git show -1 --stat
```
```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 18:11:56 2026 +0100

    task(0079): add measure deck providers

- Add expansion-provided measure deck descriptors for deterministic routing
- Refactor measure take/play flows to use provider lookup (no prefix switches)
- Add unit tests for routing, gating, and conflicts

 CHANGELOG.md                                       |   1 +
 .../0079-REF_RESOLVER-measure-decks-provider.md    | 101 ++++++++++++++++++--
 packages/expansion-02/src/index.ts                 |  12 +++
 packages/expansion-03/src/index.ts                 |  12 +++
 packages/game/src/engine/measure-deck-provider.ts  |  42 +++++++++
 packages/game/src/engine/resolver.ts               |  37 ++------
 packages/game/src/expansion-moves.ts               |  12 ++-
 packages/game/src/expansion-registry.ts            |  21 ++++-
 packages/game/test/measure-deck-provider.test.ts   | 102 +++++++++++++++++++++
 packages/rules/src/index.ts                        |  20 ++++
 10 files changed, 317 insertions(+), 43 deletions(-)
```
