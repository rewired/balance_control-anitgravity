# DD-0327 — Replay v1: Optional deterministic `typedFields` metadata for action records

## Context

Replay v1 logs deterministic move payloads in `action.args`, but some payload fields are domain-sensitive without explicit typing context (for example `convertResources.outputResort` vs generic strings, and typed/untyped conversion variants). For debugging, verification diagnostics, and long-term tooling, we need a minimal and deterministic field-type trace.

## Decision

1. Extend `action` records with optional `typedFields` metadata.
2. Define `typedFields` as a deterministic mapping from argument path (`<argIndex>.<field>`) to a constrained domain type label.
3. Start with a central mapper in the replay sink for critical move payloads, especially `convertResources`:
   - `grassrootsTileId -> tileId`
   - `outputResort -> resourceType`
   - typed variant: `inputResourceIds -> resourceId[]`
   - untyped variant: `inputCount -> resourceCount`
4. Include only values that can be derived deterministically from move args; no UI-only hints, timestamps, or runtime-only labels.
5. Add a minimal analog trace in `engine.history` (`tileType`, `resourceType`) to improve resolver auditability without changing game logic.

## Consequences

- Replay artifacts become more self-descriptive for deterministic tooling and support workflows.
- Type-label derivation is centralized, reducing drift risk from duplicated per-move switch logic.
- Replay verifier can fail-fast on malformed `typedFields` values while still treating the field as optional for backward compatibility.
