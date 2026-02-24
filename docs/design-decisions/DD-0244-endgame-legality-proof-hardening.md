# DD-0244 — Endgame Legality Proof Hardening

- **Date:** 2026-02-24
- **Status:** Accepted
- **Related Task:** 0244

## Context
Task 0244 strengthens executable evidence for CORE endgame obligations without changing runtime engine behavior. Existing tests covered the main path, but did not provide direct assertion-level coverage for winner calculation and shared-victory tie handling under end conditions.

## Decision
Add explicit test evidence for:

1. End-of-game trigger when `DrawPile` is empty after settlement gating.
2. Winner selection by counting only board-resident Influence objects.
3. Shared victory return shape on tied top score.
4. Deterministic replay stability for the immediate settlement edge path.

No engine logic or rule semantics were changed.

## Consequences
- Improves auditability of CORE-01-09-01 / 09-03 / 09-04 / 09-01A obligations.
- Reduces reliance on indirect fixture evidence for endgame legality claims.
- Maintains determinism and existing behavior.
