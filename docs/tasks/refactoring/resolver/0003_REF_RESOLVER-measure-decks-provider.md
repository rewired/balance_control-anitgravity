# Codex Task 0003_REF_RESOLVER - Measure decks as provider modules (remove prefix switches)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

**Recommended execution order:** `0001 → 0002 → 0004 → 0003 → 0005`

## 0) Metadata (frozen)

- **Task ID:** 0003
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

- [ ] Measure deck provider interface introduced
- [ ] Deck lookup used by core measure handlers
- [ ] Prefix switches removed from resolver
- [ ] Expansion gating respected (disabled expansions do not contribute deck providers)
- [ ] Tests cover deck lookup for EXP-02/EXP-03
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
