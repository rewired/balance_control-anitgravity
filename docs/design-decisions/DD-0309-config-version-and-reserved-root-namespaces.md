# DD-0309 — Config root versioning and reserved namespaces baseline

## Status
Accepted — 2026-02-26

## Context
The logging configuration contract currently defines `logging.replay` under a top-level `logging` object, but has no root version marker and no deterministic migration gate. As additional runtime domains are added, we need a stable root shape that can evolve without breaking existing replay logging consumers.

## Decision
1. Introduce root field `configVersion` with canonical v1 value `"1"`.
2. Define migration gate behavior:
   - Missing `configVersion` is treated as legacy v0 and upgraded via deterministic v0→v1 path.
   - Unknown higher versions fail fast with a clear error including supported versions.
3. Reserve top-level namespaces for forward-compatible growth:
   - `server`
   - `client`
   - `matchmaking`
   - `bot`
   - `logging` (active in v1)
4. Keep `logging.replay` contract compatible in v1 while adding the versioned root envelope.

## Consequences
- Configuration consumers can distinguish legacy payloads from native v1 payloads deterministically.
- New feature domains can be added without root-structure churn.
- Fail-fast behavior prevents accidental partial parsing of unsupported future config versions.
