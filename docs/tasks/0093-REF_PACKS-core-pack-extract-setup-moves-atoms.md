# Codex Task 0093 - REF_PACKS: Extract Core into a mandatory CorePack (setup + moves + atoms)

**Date:** 2026-02-17  
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0093
- **Area:** `packages/game` core wiring extraction into a single pack
- **Recommended execution order:** after 0092 (EnginePackRegistry exists)
- **Risk:** Medium-high (touches Setup + Resolver + move wiring)

## 1) Context (frozen)

After 0092 we have a core-capable pack registry, but core is still scattered:

- core setup is embedded in `packages/game/src/setup.ts`
- core moves are embedded via `CoreMoves` imports and manual selection in `packages/game/src/index.ts`
- core atoms are registered inline in `packages/game/src/engine/resolver.ts`

This makes it hard to:
- enforce “core is just a pack”
- avoid special cases
- reason about what core contributes

## 2) Goal (frozen)

Create a single `CorePack` definition that encapsulates core contributions:

- **Setup** (pre-shuffle and post-shuffle hooks)
- **Moves** (full core move surface)
- **Engine atoms** (core atom registrations, with hook trigger injection)

…and register it as the mandatory `core` pack through the new registry.

## 3) Non-goals (frozen)

- Do not change gameplay, rule semantics, or move legality logic.
- Do not implement new expansion moves.
- Do not rework expansion atom ownership (exp02/exp03 atoms may remain where they are for now).

## 4) Inputs (frozen)

- `packages/game/src/setup.ts` (core setup implementation)
- `packages/game/src/moves/**` (core moves)
- `packages/game/src/engine/atoms/{resource,production,measure,influence,choice,hotspot,rules}.ts`
- `packages/game/src/engine/resolver.ts` (inline core module registration)
- `packages/game/src/index.ts` (core moves imported/sliced)
- 0092 outputs:
  - pack types
  - core-capable registry

## 5) Outputs (frozen)

### A) CorePack definition

Add `packages/game/src/packs/core/index.ts` exporting:

- `export const CorePack: EnginePackDefinition`

CorePack must set:

1) `id: 'core'`
2) `name: 'CORE-01 (v1.1.0)'` (or a similarly stable label)
3) `moves`: reuse existing core move implementations from `packages/game/src/moves/**`
4) `setup.preShuffle`: move the **core pre-shuffle setup** logic out of `SetupGame`:
   - global zones init (DrawPile, DiscardFaceUp, Board, Bank, Noise)
   - personal zones + meta markers
   - start committee tile + tile zone
   - staging zones if needed (respect current semantics)
   - generate core tiles (incl ADD56) into DrawPile + create zones for each tile
   - leave expansion setup invocation to the orchestrator (SetupGame)
5) `setup.postShuffle`: move the **starting influence assignment** logic out of `SetupGame`:
   - after final shuffle, add Influence objects into PersonalSupply zones based on player count
6) `engine.atoms`: expose a factory that returns `AtomRegistration[]` for core atoms:
   - must include:
     - coreResourceAtoms
     - coreProductionAtoms
     - coreMeasureAtoms
     - coreInfluenceAtoms
     - coreChoiceAtoms
     - coreHotspotAtoms
     - createCoreRulesAtoms(...) (requires injected `triggerHook`)
   - signature should accept `{ triggerHook }` and wire it into `createCoreRulesAtoms`.

### B) SetupGame delegates to CorePack hooks

Modify `packages/game/src/setup.ts`:

- Keep: ruleset manifest + config normalization + base `G` object creation
- Replace embedded core setup code with:
  - `CorePack.setup.preShuffle(G, ctx, cfg)`
  - `EnginePackRegistry.applySetupPreShuffle(G, ctx, cfg)` for enabled expansions
  - canonical draw pile ordering + shuffle (keep the exact algorithm + anchor comments)
  - `EnginePackRegistry.applySetupPostShuffle(G, ctx, cfg)` (so core post-shuffle runs deterministically)
- Ensure expansion setup still happens **before** final DrawPile shuffle, exactly as today.

### C) Resolver consumes CorePack atoms

Modify `packages/game/src/engine/resolver.ts`:

- Replace inline `registry.registerModule({ id:'core', ... atoms:[...] })` with:
  - `CorePack.engine.atoms({ triggerHook: ... })` as the atoms source for the `core` module registration.

Keep existing exp02/exp03 registrations unchanged in this task (do not expand scope).

### D) CorePack registration

In a central place (recommended: `packages/game/src/index.ts` module initialization or a dedicated `packages/game/src/packs/register-core.ts`):

- Ensure CorePack is registered into the pack registry exactly once.
- If you choose auto-registration inside `@balance-control/game`, it must be deterministic and must not depend on import order across workspace packages.

(If you choose **explicit** registration by entrypoints, defer that to Task 0095, but then update tests in this task so they register CorePack before using the factory.)

### E) Tests

Update / add tests:

- Setup tests must still pass and produce identical invariants (zones, tiles, starting influence counts).
- Golden replay tests must pass unchanged.
- Add a focused unit test that calls `CorePack.setup.preShuffle` and asserts it initializes the Start Committee + base zones deterministically.

## 6) Constraints (frozen)

- Preserve all existing CORE-01 anchor comments and algorithms (especially shuffle and draw pile ordering).
- Do not introduce any new randomness calls.
- Do not change object ids that are relied on by tests (e.g., `tile_start_committee`, `meta_{pid}`) unless tests are updated and determinism is preserved.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-002 (Engine-only Rule Execution)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/rules/000-core.md` (setup + shuffle anchors)

## 8) Acceptance Criteria (frozen)

- `CorePack` exists and encapsulates core setup + moves + atom registrations.
- `SetupGame` delegates core initialization via pack hooks.
- `EffectResolver` sources core atoms via CorePack, not inline arrays.
- Full test suite passes (`pnpm -r test`), including golden replays.

## 9) PR Checklist (frozen)

- [ ] CorePack added (`packages/game/src/packs/core/index.ts`)
- [ ] SetupGame delegates to CorePack hooks (pre/post shuffle)
- [ ] Resolver uses CorePack atoms (triggerHook injection preserved)
- [ ] CorePack registration handled deterministically (tests updated accordingly)
- [ ] Tests pass (`pnpm -r test`)
- [ ] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- ...

### Commands Run

- ...

### Postflight Proof

- `git status`
- `pnpm -r test`
