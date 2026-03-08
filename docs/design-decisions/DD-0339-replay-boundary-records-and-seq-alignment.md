# DD-0339 — Replay NDJSON boundary records and verifier alignment

## Status
Accepted — 2026-03-08

## Context

Replay Format v1 requires deterministic boundary records (`header` first, `footer` last) and optional `checkpoint` records at deterministic cadence. Existing server replay logging wrote only body records and depended on engine-emitted action sequence values that started at `0`, while the verifier contract expects `action.seq >= 1` and contiguous increments.

## Decision

1. Align engine replay action sequencing to start at `1` and increment only on successful authoritative actions.
2. Extend replay records emitted from game hooks with deterministic metadata (`matchConfig`, canonical `expansions`) so the server sink can emit a complete v1 `header` without inferring runtime-specific values.
3. Update the server NDJSON sink to:
   - emit exactly one `header` per match stream before first body record,
   - optionally emit `checkpoint` records after action writes when `checkpointEveryActions` cadence is configured and state hash exists,
   - emit exactly one `footer` during sink close with `totalActions` and terminal `finalStateHash`.
4. Add integration tests that generate a replay file via the real sink and run the resulting NDJSON records through `verifyReplayRecords` with checkpoint/footer hash verification enabled.

## Consequences

- Replay files now comply with v1 file ordering constraints and include required boundary records.
- Verifier round-trip tests cover the server writer output shape directly.
- `action.seq` compatibility is unified between writer and verifier expectations.
