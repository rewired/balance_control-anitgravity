# S03 — Spec Anchor Tracer (@rule hygiene)

## Purpose
Keep code traceable to the simulation spec via exact rule IDs,
and prevent “creative reinterpretation” during refactors.

## Use when
- Implementing or refactoring any move/effect resolver
- Touching legality enumeration or effect stacking
- Introducing new helpers that resolve costs/modifiers

## Inputs
- A rule anchor (e.g., `CORE-01-06-16`, `EXP-02-04-B`, etc.)
- Target code area

## Output
- TSDoc updated with exact `@rule` tags
- A short “anchor map” note in the task file:
  - rule → function(s) → file(s)

## Steps
1. **Locate anchors**
   - `rg -n "CORE-01-|EXP-01-|EXP-02-|EXP-03-" packages/game packages/expansion-*`
2. **Add/verify TSDoc tags**
   - Every exported symbol that implements a rule gets:
     - `@rule <EXACT_ID>`
     - `@deterministic`
     - `@pure` OR `@sideEffects`
3. **No anchor?**
   - Mark as infrastructure:
     - `@remarks infrastructure; no direct SPEC binding`
4. **Enforce exact spelling**
   - Match casing and punctuation exactly (no aliases).

## Guardrails
- Never invent anchors.
- If logic spans multiple rules, use multiple `@rule` tags (one per anchor).
