# Codex Task 0077 - REF_RESOLVER: EngineModuleRegistry (no override, deterministic dispatch)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`

## 0) Metadata (frozen)

- **Task ID:** 0077
- **Area:** Resolver modularization (module registry)
- **Risk:** Medium-high (touches dispatch path; must preserve single canonical resolver)

## 1) Context (frozen)

We want expansions to "register their own resolver contributions" without creating multiple resolvers.
This must remain compatible with the canonical single resolver pipeline (AGENTS 3.5 / guardrail GR-007).

## 2) Goal (frozen)

Introduce an engine-level module registry that allows:

- registering `atom.kind -> handler` mappings per module (Core, EXP-02, EXP-03)
- deterministic module ordering
- a hard prohibition on overrides (duplicate `atom.kind` registration is an error)

Core is treated as a mandatory module that is always enabled.

Failure behavior requirements:

- Duplicate `atom.kind` registration must throw an error with a deterministic message (stable text; stable listing order).
- If multiple conflicts exist, the conflict list must be ordered deterministically (e.g. by canonical module order, then by `atom.kind`).

## 3) Non-goals (frozen)

- No expansion may override a core atom handler
- No change to the resolver pipeline ordering; this is dispatch modularization only
- No new atom kinds in this task (only wiring)

## 4) Inputs (frozen)

- `packages/game/src/engine/types.ts` (EffectAtom kinds)
- `packages/game/src/engine/resolver.ts` (current switch-based dispatch)
- `packages/game/src/expansion-registry.ts` (enablement flags)
- Existing expansion definitions (for later wiring)

## 5) Outputs (frozen)

- New `EngineModuleRegistry` (location in `packages/game/src/engine/` or adjacent)
- Core module registration (mandatory, always enabled)
- EXP-02 and EXP-03 module registrations gated by expansion flags
- Minimal unit test: duplicate `atom.kind` registration fails deterministically

## 6) Constraints (frozen)

- Single canonical resolver remains the only place the queue is executed (AGENTS 3.5)
- Dispatch lookup must be deterministic (explicit ordering; no object-key iteration semantics)
- No changes to rules or legality enumeration behavior
- Core module is always enabled; expansion modules are enabled only when their canonical flag is `true`

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-007 (Effect CPU Resolution Order)
- GR-009 (Zone Invariants)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-03-MEASURE-CPU.md` (resolution order and CPU model)
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-007, GR-012)
- AGENTS: 3.5 (Canonical Effect Resolver), 3.8 (Expansion Isolation Layer)

## 8) Acceptance Criteria (frozen)

- Resolver dispatch uses module registry (or is capable of doing so) without changing pipeline order
- Duplicate `atom.kind` registration is rejected (no override policy enforced)
- Expansion enablement gating is respected via canonical config source
- Tests pass

## 9) PR Checklist (frozen)

- [x] `EngineModuleRegistry` introduced with deterministic ordering
- [x] No override policy enforced (duplicate kind is an error)
- [x] Core module is mandatory and always enabled
- [x] EXP modules are gated by config flags (canonical source)
- [x] Tests added for no-override behavior
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

- Introduced `EngineModuleRegistry` to register `atom.kind -> handler` maps by module in canonical order.
- Refactored `EffectResolver` dispatch to use the registry without changing the resolver pipeline ordering.
- Added deterministic no-override error behavior and a unit test covering conflict ordering.
- Gated EXP-02/EXP-03 atom handlers by `G.meta.cfg.expansions` flags (canonical config source).
- Updated `CHANGELOG.md` entry for the new dispatch modularization.

### Commands Run

TBD

```bash
git status
```
```
On branch task/0077-engine-module-registry
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   packages/game/src/engine/resolver.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/game/src/engine/engine-module-registry.ts
	packages/game/test/engine-module-registry.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
```
```
 CHANGELOG.md                         |   1 +
 packages/game/src/engine/resolver.ts | 201 +++++++++++++++++++++--------------
 2 files changed, 124 insertions(+), 78 deletions(-)
```

```bash
pnpm test
```
```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  Test Files  24 passed (24)
packages/game test:       Tests  93 passed (93)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test: Done
```

```bash
pnpm lint
```
```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

```bash
git show -1 --stat
```
```
 CHANGELOG.md                                       |   1 +
 .../0077-REF_RESOLVER-engine-module-registry.md    |  84 ++++++++-
 packages/game/src/engine/engine-module-registry.ts |  90 +++++++++
 packages/game/src/engine/resolver.ts               | 201 +++++++++++++--------
 packages/game/test/engine-module-registry.test.ts  |  36 ++++
 5 files changed, 328 insertions(+), 84 deletions(-)
```
