# DD-0343 — Replay header requires concrete seed and matchConfig metadata

- **Date:** 2026-03-08
- **Status:** Accepted
- **Task:** 0343

## Context

Replay schema version `1` header records currently permit fallback placeholders when metadata is missing at emission time (`seed: "unknown-seed"`, `matchConfig: { players: 2 }`). This creates unverifiable or misleading replay artifacts and obscures upstream metadata propagation faults.

## Decision

For schema version `1`, replay header emission now requires concrete metadata values:

- `seed` must be present and non-empty before writing the header.
- `matchConfig` must be present as an object before writing the header.
- If either field is missing, replay sink throws a descriptive error including stream key and match identifier context.

Metadata capture paths (`ensureStream` + `captureHeaderMetadata`) remain responsible for first-seen metadata capture from incoming records before header emission.

## Consequences

- Replay files will no longer silently include synthetic fallback values in headers.
- Metadata propagation bugs fail fast with actionable diagnostics.
- Deterministic replay provenance is strengthened without changing replay record ordering semantics.
