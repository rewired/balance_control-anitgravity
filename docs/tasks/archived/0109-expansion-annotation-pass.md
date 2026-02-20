# Codex Task 0109 - Expansion Documentation Pass (Isolation + Stacking References)

**Date:** 2026-02-17
**Style:** Codex task contract
**Primary contract:** AGENTS.md (repo root)

---

## Goal

Document expansion-scoped engine code with explicit:
- expansion identity
- isolation guarantees (no cross-expansion mixing)
- stacking / resolution order references

No behavior changes.

---

## Referenced Specifications (aliases defined in ARCH-01)

- SPEC-CORE-01 = /docs/rules/000-core.md
- SPEC-EXP-01  = /docs/rules/001-expansion01.md
- SPEC-EXP-02  = /docs/rules/002-expansion02.md
- SPEC-EXP-03  = /docs/rules/003-expansion03.md

---

## Inputs

- /docs/architecture/ARCH-02-STATE-SHAPE.md
- /docs/architecture/ARCH-03-MEASURE-CPU.md
- /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md
- Expansion-related code in packages/game

---

## Outputs

For each expansion module / resolver area:

Add a header TSDoc block that includes:
- @expansion EXP-01|EXP-02|EXP-03
- @requires SPEC-CORE-01 (when appropriate)
- @deterministic
- @rule <primary rule anchor for that module> (canonical; see ARCH-05 mini-rule)

Required rule anchors (at least):
- EXP-01: Measure lifecycle / timing references (EXP-01-07 / EXP-01-06 where applicable)
- EXP-02: Regulation resolution order references (EXP-02-04-B)
- EXP-03: Climate stacking references (EXP-03-10) and Countdown semantics where implemented

Also ensure any functions that apply stacking order include explicit @remarks describing the order and referencing the SPEC rule anchor.

---

## Constraints

- No logic modifications.
- No refactors beyond comments.
- No introduction of cross-expansion shared zones.

---

## Invariants

- Expansion zones remain isolated (ARCH-02).
- Measure CPU order preserved (ARCH-03).

---

## Acceptance Criteria

- Expansion-scoped code has clear @expansion tags.
- Stacking / resolution order code references correct SPEC anchors (canonical tokens).
- No runtime behavior changes; tests pass.

---

## PR Checklist

- [ ] EXP-01 docs: measure lifecycle references included
- [ ] EXP-02 docs: EXP-02-04-B referenced where regulations are applied
- [ ] EXP-03 docs: EXP-03-10 referenced where climate stacking applies
- [ ] Rule IDs are canonical (ARCH-05 mini-rule)
- [ ] No behavior changes
- [ ] CI/tests pass
- [ ] Meaningful commit message
