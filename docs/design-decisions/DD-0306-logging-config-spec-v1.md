# DD-0306 — Logging config specification v1 baseline

- Status: Accepted
- Date: 2026-02-26
- Task: 0306

## Context

A documentation-only task requires a canonical v1 logging configuration contract under `docs/`, including a replay logging subtree and explicit forward-compatibility behavior.

## Decision

1. Add `docs/logging-config-v1.md` as the canonical v1 logging config specification.
2. Define `logging` as top-level and `logging.replay` as the active v1 subtree.
3. Reserve `logging.console`, `logging.file`, and `logging.redaction` for future versions.
4. Require unknown fields to be tolerated but logged (forward-compatibility rule).
5. Constrain `logging.replay.format` to `ndjson` in v1.

## Consequences

- A stable baseline exists for future runtime implementation without premature format proliferation.
- Forward-compatibility is explicit, reducing breakage risk for newer config producers.
- Future extensions can be introduced by adding versioned docs while preserving v1 behavior.
