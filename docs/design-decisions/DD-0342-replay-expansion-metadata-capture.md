# DD-0342 — Replay Expansion Metadata Capture Sentinel Handling

- **Status:** Accepted
- **Date:** 2026-03-08
- **Task:** 0342

## Context

`packages/server/src/replay-logging.ts` persists replay header metadata by accumulating seed/matchConfig/expansions into stream-local state before first header emission. The previous stream initialization normalized `record.expansions` immediately, including when absent (`undefined`), resulting in `[]` as an eager default sentinel.

Using `[]` as the initialized value made "unset" indistinguishable from "explicitly observed empty expansion metadata" for subsequent capture logic.

## Decision

1. Keep `StreamState.expansions` as `undefined` until an actual `record.expansions` array is observed.
2. In `ensureStream`, assign `expansions` only when `Array.isArray(record.expansions)` is true.
3. In `captureHeaderMetadata`, treat only `undefined` as unset (`typeof streamState.expansions === 'undefined'`) and capture the first valid expansions array exactly once.
4. Keep canonicalization/output responsibility in `ensureHeader` (`normalizeExpansions(...)`) immediately before header emission.

## Consequences

- Header emission still outputs a canonical array (`[]` when no expansions were observed), preserving replay schema stability.
- Late-arriving valid expansion metadata can be captured correctly in pre-header flows because unset is no longer conflated with empty-array defaulting.
- Determinism is unchanged: canonical sorted/deduplicated expansion output remains centralized at emit time.
