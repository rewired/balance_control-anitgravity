# ARCH-01 — ENGINE / CLIENT SEPARATION CONTRACT
Version: 1.1
Status: Normative
Scope: Software Architecture Layer

## REFERENCED SPECIFICATIONS
SPEC-CORE-01  = /docs/rules/000-core.md
SPEC-EXP-01   = /docs/rules/001-expansion01.md
SPEC-EXP-02   = /docs/rules/002-expansion02.md
SPEC-EXP-03   = /docs/rules/003-expansion03.md

## PURPOSE
Define authoritative separation between rule engine and presentation layer.
Guarantee determinism and absence of rule duplication.

## STATE AUTHORITY
All authoritative state exists exclusively in packages/game.
State must comply with SPEC-CORE-01 CORE-01-00.
State must be JSON-serializable.
No functions or derived caches allowed.

## RULE EXECUTION
All rule execution occurs exclusively in packages/game.
Moves must be pure and deterministic.
Production must follow SPEC-CORE-01 CORE-01-06-16.
Regulation resolution must follow SPEC-EXP-02 EXP-02-04-B.
Climate stacking must follow SPEC-EXP-03 EXP-03-10.

## LEGALITY ENUMERATION
Legal actions must be enumerated via:
enumerateLegalIntents(G, ctx, playerID)
Enumeration must be pure and share helpers with move validation.

## CLIENT RESTRICTIONS
Client must not compute legality, costs, majority, or modifiers.
Client renders only from G, ctx, selectors, and enumerateLegalIntents.

## DETERMINISM
Identical move sequence must produce identical state hash.
No hidden state permitted.

## BOOT CONTRACT
CorePack must be registered before createBalanceControlGame().
