# ARCH-03 — MEASURE CPU CONTRACT
Version: 1.1
Status: Normative

## PURPOSE
Define deterministic multi-stage effect resolution.

## PENDING CHOICE
If G.engine.pendingChoice exists,
only ResolveChoice intents are valid.

## RESOLUTION ORDER
1. Prohibition
2. Cost calculation
3. Payment
4. Output modifiers
5. State mutation

Order must respect SPEC-CORE-01 and expansion stacking rules.

## NO IMPLICIT EFFECTS
All measure interactions must be explicit.
No hidden stacking permitted.
