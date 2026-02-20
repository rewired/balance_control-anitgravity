# Codex Task 0076 - REF_RESOLVER: legacy registry normalization (ids, order, enablement)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`

## 0) Metadata (frozen)

- **Task ID:** 0076
- **Area:** Resolver refactor (prework)
- **Risk:** Medium (touches expansion enablement + determinism)

## 1) Context (frozen)

We want to modularize the resolver so expansions can register their own engine modules (handlers/hooks) without introducing multiple resolvers.
Today, `packages/game/src/expansion-registry.ts` derives enablement partly via expansion `name` mapping and iterates a `Map`, which risks implicit ordering semantics.

## 2) Goal (frozen)

Normalize expansion identity and iteration order so that:

- expansion enablement is determined via a canonical id/flag mapping, not free-form `name` strings
- registry iteration order is deterministic and explicit
- later tasks can safely rely on stable module ordering when registering resolver-adjacent behavior

Additionally, explicitly define a canonical module/expansion order list (example):

- `['core', 'exp01', 'exp02', 'exp03']`

This order must be the single source of truth for ordering and must not be derived indirectly from object keys, map insertion order, or registration side effects.

## 3) Non-goals (frozen)

- No changes to `packages/game/src/engine/resolver.ts` behavior in this task
- No rule changes and no new mechanics
- No changes to client/server behavior beyond reading the same enablement flags deterministically

## 4) Inputs (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- `packages/game/src/expansion-registry.ts`
- `packages/game/src/config.ts` (or wherever expansion flags live)
- Existing expansion packages: `packages/expansion-01`, `packages/expansion-02`, `packages/expansion-03`

## 5) Outputs (frozen)

- Updated `packages/game/src/expansion-registry.ts` to use canonical ids + deterministic ordering
- (If required) small config/type additions to support canonical ids
- Tests adjusted/added only if needed to lock determinism of ordering (keep minimal)

## 6) Constraints (frozen)

- Must preserve determinism (no reliance on JS object insertion order as semantics)
- Enablement MUST come only from match config (canonical source). It must not be derived from arbitrary state slices (see GR-012), including but not limited to: `G.engine.attributes.*`, "zone exists", or similar heuristics.
- Keep changes minimal and localized to registry/config

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-009 (Zone Invariants) - ordering must not create phantom expansion behavior
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012)
- `docs/architecture/ARCH-03-MEASURE-CPU.md` (deterministic resolution context)

## 8) Acceptance Criteria (frozen)

- Expansion enable/disable behavior matches current behavior for ex01/ex02/ex03
- Registry iteration order is explicit, documented, and deterministic (exactly the canonical list; no hidden secondary ordering)
- No changes required in `packages/game/src/engine/resolver.ts` in this task
- Negative: registry does not read enablement from state slices (e.g. `G.engine.attributes.enabledExpansions`) and does not infer enablement from zone existence
- Existing tests pass

## 9) PR Checklist (frozen)

- [x] Canonical expansion ids/flags introduced (no `name`-string dependence for enablement)
- [x] Deterministic iteration order defined and used
- [x] No resolver semantics changed
- [x] Tests pass
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added canonical expansion ids (`exp01`/`exp02`/`exp03`) and deterministic registry iteration order.
- Removed expansion enablement inference from arbitrary state slices; enablement now reads from match config snapshot.
- Stamped canonical match config onto `G.meta.cfg` during setup (GR-012).
- Updated unit tests + golden fixtures/hashes impacted by the new stable state field.
- Updated `CHANGELOG.md` entry for the registry/config normalization.

### Commands Run

```bash
git status
```
```
On branch task/0076-registry-normalization
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   packages/expansion-01/src/index.ts
	modified:   packages/expansion-02/src/index.ts
	modified:   packages/expansion-03/src/index.ts
	modified:   packages/game/src/config.ts
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/game/src/setup.ts
	modified:   packages/game/test/expansion.test.ts
	modified:   packages/game/test/golden/core_hotspot_convert_pingpong.json
	modified:   packages/game/test/golden/core_only_3p_2rounds.json
	modified:   packages/game/test/golden/core_pingpong_meta_marker.json
	modified:   packages/game/test/golden/core_plus_ex01_small.json
	modified:   packages/game/test/golden/production_uncontrolled_produces_zero.json
	modified:   packages/game/test/replay-runner.test.ts
	modified:   packages/game/test/resolver.test.ts
	modified:   packages/game/test/setup.test.ts
	modified:   packages/rules/src/index.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 CHANGELOG.md                                       |   1 +
 packages/expansion-01/src/index.ts                 |   1 +
 packages/expansion-02/src/index.ts                 |   1 +
 packages/expansion-03/src/index.ts                 |   1 +
 packages/game/src/config.ts                        |  11 +-
 packages/game/src/expansion-registry.ts            | 127 ++++++++++++---------
 packages/game/src/setup.ts                         |   1 +
 packages/game/test/expansion.test.ts               |  14 ++-
 .../test/golden/core_hotspot_convert_pingpong.json |   2 +-
 .../game/test/golden/core_only_3p_2rounds.json     |   2 +-
 .../test/golden/core_pingpong_meta_marker.json     |   2 +-
 .../game/test/golden/core_plus_ex01_small.json     |   2 +-
 .../production_uncontrolled_produces_zero.json     |   2 +-
 packages/game/test/replay-runner.test.ts           |   2 +-
 packages/game/test/resolver.test.ts                |   4 +
 packages/game/test/setup.test.ts                   |   2 +
 packages/rules/src/index.ts                        |  16 +++
 17 files changed, 120 insertions(+), 71 deletions(-)
```

```bash
pnpm test
```
```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  92 passed (92)
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
 CHANGELOG.md                                       |   1 +
 .../0076-REF_RESOLVER-registry-normalization.md    |  87 ++++++++++++--
 packages/expansion-01/src/index.ts                 |   1 +
 packages/expansion-02/src/index.ts                 |   1 +
 packages/expansion-03/src/index.ts                 |   1 +
 packages/game/src/config.ts                        |  11 +-
 packages/game/src/expansion-registry.ts            | 127 ++++++++++++---------
 packages/game/src/setup.ts                         |   1 +
 packages/game/test/expansion.test.ts               |  14 ++-
 .../test/golden/core_hotspot_convert_pingpong.json |   2 +-
 .../game/test/golden/core_only_3p_2rounds.json     |   2 +-
 .../test/golden/core_pingpong_meta_marker.json     |   2 +-
 .../game/test/golden/core_plus_ex01_small.json     |   2 +-
 .../production_uncontrolled_produces_zero.json     |   2 +-
 packages/game/test/replay-runner.test.ts           |   2 +-
 packages/game/test/resolver.test.ts                |   4 +
 packages/game/test/setup.test.ts                   |   2 +
 packages/rules/src/index.ts                        |  16 +++
 18 files changed, 200 insertions(+), 78 deletions(-)
```
