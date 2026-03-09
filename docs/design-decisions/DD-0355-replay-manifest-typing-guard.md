# DD-0355 — Replay manifest metadata access via explicit type guard

- **Date:** 2026-03-09
- **Status:** Accepted
- **Task:** 0355

## Context

`packages/server/src/replay-logging.ts` accessed replay union fields through repeated `(record as any)` casts, including manifest metadata (`seed`, `matchConfig`, `expansions`, `loggingMode`) and filename/hash derivation fields. This weakened type safety and made future schema drift harder to detect during compile time.

## Decision

1. Introduce an explicit type guard:
   - `isReplayManifestRecord(record): record is ReplayManifestRecord`.
2. Restrict manifest metadata access (`seed`, `matchConfig`, `expansions`, `loggingMode`) to guarded branches only.
3. Replace cast-based filename/hash extraction with typed helpers:
   - `getRecordMatchId`
   - `getRecordSeed`
   - `getRecordStateHash`
4. Re-export `ReplayManifestRecord` from `@balance-control/game` package entrypoint for stable external typing.

## Consequences

- Compile-time safety improves without runtime behavior changes.
- Server replay sink now encodes union-field access policy explicitly.
- `@balance-control/game` public type surface is slightly expanded with a replay-specific type export.

## Alternatives Considered

- Keep `(record as any)` casts and rely on tests only.
  - Rejected: does not protect against accidental type/schema drift at compile time.
