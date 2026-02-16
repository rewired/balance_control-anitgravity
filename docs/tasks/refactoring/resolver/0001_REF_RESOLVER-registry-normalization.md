# Codex Task 0001_REF_RESOLVER - ExpansionRegistry normalization (ids, order, enablement)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0001 → 0002 → 0004 → 0003 → 0005`

## 0) Metadata (frozen)

- **Task ID:** 0001
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

- [ ] Canonical expansion ids/flags introduced (no `name`-string dependence for enablement)
- [ ] Deterministic iteration order defined and used
- [ ] No resolver semantics changed
- [ ] Tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
