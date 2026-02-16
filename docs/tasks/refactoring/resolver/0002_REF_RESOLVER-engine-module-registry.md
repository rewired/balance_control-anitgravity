# Codex Task 0002_REF_RESOLVER - EngineModuleRegistry (no override, deterministic dispatch)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0001 → 0002 → 0004 → 0003 → 0005`

## 0) Metadata (frozen)

- **Task ID:** 0002
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

- [ ] `EngineModuleRegistry` introduced with deterministic ordering
- [ ] No override policy enforced (duplicate kind is an error)
- [ ] Core module is mandatory and always enabled
- [ ] EXP modules are gated by config flags (canonical source)
- [ ] Tests added for no-override behavior
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
