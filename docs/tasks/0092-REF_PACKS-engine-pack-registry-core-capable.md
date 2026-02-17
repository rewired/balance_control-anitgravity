# Codex Task 0092 - REF_PACKS: Promote ExpansionRegistry to EnginePackRegistry (Core-capable)

**Date:** 2026-02-17  
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0092
- **Area:** `packages/game` registry layer (expansions -> packs) + public API
- **Recommended execution order:** after 0088 (factory move superset)
- **Risk:** Medium (API surface + many call sites)

## 1) Context (frozen)

We already have deterministic, canonical ordering concepts in place:

- `CANONICAL_ENGINE_MODULE_ORDER = ['core','exp01','exp02','exp03']` exists in `packages/game/src/expansion-registry.ts`
- We have separate registries for:
  - moves (`move-module-registry.ts`)
  - atoms (`engine/engine-module-registry.ts`)
- But **core is still not a first-class “pack”**:
  - `ExpansionRegistry` only accepts `ExpansionId` (`exp01..03`)
  - core wiring is still special-cased (setup/moves/resolver)

Goal direction:
- Treat **CORE** as a **mandatory pack** that is registered and assembled like any other pack.
- Keep determinism and “no silent overwrite” guarantees.

## 2) Goal (frozen)

Introduce a **single pack registry contract** that can register:

- `core` (mandatory pack)
- `exp01/exp02/exp03` (optional packs; enabled via match config flags)

…and can expose pack contributions in a canonical, deterministic way for:
- move assembly (superset + enabled subsets)
- setup hooks (pre-shuffle and optional post-shuffle)
- engine atom modules (optional; used by resolver wiring)

## 3) Non-goals (frozen)

- Do **not** move or refactor core implementation yet (that is Task 0093).
- Do **not** add new gameplay rules, moves, or atoms.
- Do **not** change match config structure (`G.meta.cfg`).

## 4) Inputs (frozen)

- `packages/game/src/expansion-registry.ts` (current registry)
- `packages/game/src/move-assembly.ts`
- `packages/game/src/engine/engine-module-registry.ts`
- `packages/game/src/engine/resolver.ts`
- Consumers importing `ExpansionRegistry`:
  - `packages/client-web/src/game.ts`
  - `packages/server/src/index.ts`
  - `packages/bot-llm/src/index.ts`
  - multiple `packages/game/test/*.test.ts`

## 5) Outputs (frozen)

### A) Define pack contract (types)

Create a new pack contract type in `packages/game/src/packs/types.ts` (or equivalent, but keep it central):

- `EnginePackId` = `'core' | 'exp01' | 'exp02' | 'exp03'`
- `EnginePackDefinition` with (all optional except id+name):
  - `id: EnginePackId`
  - `name: string`
  - `moves?: Record<string, (...args: any[]) => any>`
  - `setup?: { preShuffle?: (G, ctx, cfg) => void; postShuffle?: (G, ctx, cfg) => void }`
  - `engine?: { atoms?: (args: { triggerHook: Function }) => import('../engine/engine-module-registry').AtomRegistration[] }`

Notes:
- Keep the contract **compatible with existing expansion definitions**: expansions can be adapted/wrapped without modifying `@balance-control/expansion-0x` packages in this task.
- Do not over-design. The goal is: “core can be represented”.

### B) Implement EnginePackRegistry (core-capable)

Refactor `packages/game/src/expansion-registry.ts` into a core-capable registry:

- Keep `CANONICAL_ENGINE_MODULE_ORDER` as the single ordering source.
- Add storage for packs by `EnginePackId` (not only expansions).
- Enablement rules:
  - `core` is always enabled.
  - `exp0x` enabled based on `ExpansionFlags` (`ex01/ex02/ex03`) from config / `G.meta.cfg`.

API expectations (minimum):
- `registerPack(def: EnginePackDefinition): void`
- `getRegisteredPacks(): EnginePackDefinition[]` (canonical order)
- `getEnabledPacks(G?: GameState, cfg?: GameConfig): EnginePackDefinition[]`
- `getRegisteredMoveModules(): MoveModule[]` (includes core if it has moves)
- `getEnabledMoveModules(cfg?: GameConfig): MoveModule[]` (includes core always; expansions gated)
- `applySetupPreShuffle(...)` and `applySetupPostShuffle(...)` helpers that execute pack hooks in canonical order.

### C) Backward compatibility shim

To avoid a flag day across packages, keep a compatibility export:

- Keep `export const ExpansionRegistry = EnginePackRegistry` (or re-export alias)
- Keep existing `register(...)` working for expansions (wrap to `registerPack(...)`), but **do not** allow registering core through the old method.

Document in code comments:
- “ExpansionRegistry is deprecated; use EnginePackRegistry / registerPack.”

### D) Tests

Update / add tests in `packages/game/test`:

- Registry ordering is canonical and deterministic.
- Duplicate pack id registration is rejected.
- Duplicate move ids across packs are rejected deterministically (no silent overwrite).
- Enabled pack selection:
  - core always enabled
  - expansions match flags

Keep all existing tests passing.

## 6) Constraints (frozen)

- Determinism: do not rely on object insertion order; always sort keys when merging.
- No override: duplicates must throw with an actionable error.
- Core-mandatory: the new registry must have an explicit concept that `core` is always enabled (even if not registered yet).

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)
- GR-002 (Engine-only Rule Execution)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012, GR-002)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

## 8) Acceptance Criteria (frozen)

- `EnginePackRegistry` exists and can register `core` plus expansions.
- Canonical ordering is enforced for all public registry outputs.
- Duplicate ids (pack id, move id) throw deterministically.
- Existing test suite passes (`pnpm -r test`).

## 9) PR Checklist (frozen)

- [ ] Pack contract added (`packs/types.ts` or equivalent)
- [ ] Registry refactor complete and backward-compatible
- [ ] Deterministic ordering + no-override invariants enforced
- [ ] Tests updated/added and passing (`pnpm -r test`)
- [ ] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- ...

### Commands Run

- ...

### Postflight Proof

- `git status`
- `pnpm -r test`
