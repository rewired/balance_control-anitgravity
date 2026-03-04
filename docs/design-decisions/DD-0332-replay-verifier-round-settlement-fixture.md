# DD-0332 — Clarify replay verifier checkpoint coverage and add mismatch control

- **Date:** 2026-03-04
- **Status:** Accepted
- **Task:** 0332

## Context

`replay-verify.test.ts` validated `system.roundSettlement.stateHash` with a single-action fixture and did not include a negative mismatch control. This left checkpoint verification assertions too permissive and ambiguous about what they covered.

## Decision

Keep the existing deterministic single-action fixture, but tighten verifier assertions by:

1. adding a dedicated negative control that injects a known non-matching checkpoint hash and asserts `system.roundSettlement hash mismatch`.
2. renaming the `settlementKind: "final"` test to explicitly state it validates checkpoint hashing behavior for that enum value.

## Rationale

- Improves replay verifier regression sensitivity without changing runtime engine behavior.
- Clarifies that the `final`-kind test is verifier payload coverage, not an end-to-end auto-final-settlement path test.

## Consequences

- Replay verifier tests now include explicit positive and negative checkpoint-hash controls.
- Future work can add dedicated full-settlement fixture coverage independently of this verifier-unit tightening.
