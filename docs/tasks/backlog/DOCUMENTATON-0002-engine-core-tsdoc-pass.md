# Codex Task 0002 - Engine Core TSDoc Annotation Pass (Rule-Linked)

**Date:** 2026-02-17
**Style:** Codex task contract
**Primary contract:** AGENTS.md (repo root)

---

## Goal

Annotate the engine core in packages/game with TSDoc according to ARCH-05.

Focus on rule execution paths:
- enumerateLegalIntents
- move resolvers (boardgame.io moves)
- production resolution
- majority calculation
- hotspot resolution
- meta-marker handling
- convert/formalize logic

No behavior changes.

---

## Referenced Specifications (aliases defined in ARCH-01)

- SPEC-CORE-01 = /docs/rules/000-core.md
- SPEC-EXP-01  = /docs/rules/001-expansion01.md
- SPEC-EXP-02  = /docs/rules/002-expansion02.md
- SPEC-EXP-03  = /docs/rules/003-expansion03.md

---

## Inputs

- /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md (from Task 0102)
- /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- /docs/architecture/ARCH-03-MEASURE-CPU.md
- packages/game source tree

---

## Outputs

For every exported symbol in packages/game that participates in rule execution:

Add TSDoc blocks including, at minimum:
- @rule <RULE_ID> (canonical anchor token; see ARCH-05 mini-rule)
- @deterministic
- exactly one of: @pure | @sideEffects
- @remarks (when needed for clarity)

Examples (adapt to actual function names):

/**
 * Computes majority and control for a tile.
 * @rule CORE-01-05-03A
 * @deterministic
 * @pure
 */

/**
 * Resolves resort production during settlement.
 * @rule CORE-01-06-16
 * @deterministic
 * @sideEffects Moves Resources Bank -> PersonalSupply and remainder -> Noise
 */

Additionally:
- Any state mutation helper MUST be @sideEffects.
- Any function that only computes derived values MUST be @pure.

---

## Constraints

- Do NOT modify logic or signatures.
- Do NOT rename exports.
- Do NOT refactor beyond comment placement or line wrapping.
- Maintain determinism.

---

## Invariants

- Authoritative state remains JSON-serializable (ARCH-02).
- Rule execution remains in packages/game only (ARCH-01).
- Resolver order remains unchanged (ARCH-03).

---

## Acceptance Criteria

- All exported engine rule functions have TSDoc compliant with ARCH-05.
- All rule bindings use canonical SPEC anchors (no invented names).
- No test failures and no TypeScript errors.

---

## PR Checklist

- [ ] All relevant exports in packages/game annotated
- [ ] enumerateLegalIntents annotated and rule-linked
- [ ] Move resolvers annotated and rule-linked
- [ ] Rule IDs are canonical (ARCH-05 mini-rule)
- [ ] No behavior changes
- [ ] CI/tests pass
- [ ] Meaningful commit message
