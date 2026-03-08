# DD-0344 — Replay v1 footer `finalStateHash` must be non-empty and verifier-strict

- Status: Accepted
- Date: 2026-03-08
- Deciders: Engine/Server maintainers
- Related: `docs/replay-format-v1.md`, Task 0344

## Context

Replay v1 defines `footer.finalStateHash` as deterministic terminal hash metadata. Existing sink behavior could emit an empty string when no `stateHash` was observed, and verifier behavior skipped final hash checks for empty string when `verifyFinalHash` was enabled.

That combination created a silent contract hole: malformed replay files could appear structurally valid while bypassing intended deterministic integrity checks.

## Decision

1. **Sink strictness:** `close()` MUST throw and MUST NOT emit footer if no non-empty `lastStateHash` was captured for the stream.
2. **Verifier strictness:** when `verifyFinalHash` is enabled, empty/missing `footer.finalStateHash` is invalid and MUST fail verification.
3. **Format clarification:** Replay format docs explicitly require a non-empty `finalStateHash`.

## Consequences

- Replay producers now fail fast for hashless streams instead of persisting invalid footers.
- Replay verification now reliably enforces final hash integrity in strict mode.
- Existing malformed artifacts with empty footer hash fail under strict verification and require regeneration.
