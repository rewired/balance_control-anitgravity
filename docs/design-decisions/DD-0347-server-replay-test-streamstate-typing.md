# DD-0347 — Align server replay test stream-state typing with sink internals

- **Status:** Accepted
- **Date:** 2026-03-09
- **Task:** 0347

## Context

`pnpm -w build` failed in `packages/server` because `replay-logging.test.ts` augmented private sink helper signatures with a narrowed stream-state shape that omitted `lastStateHash`. The same test then assigned `streamState.lastStateHash`, causing a TypeScript structural mismatch.

## Decision

1. Update only the local test harness type annotations in `replay-logging.test.ts`.
2. Add optional `lastStateHash?: string` to the helper stream-state structures used for `ensureStream`, `captureHeaderMetadata`, and `ensureHeader`.
3. Keep runtime replay sink behavior unchanged.

## Consequences

- Server package build/typecheck passes again.
- Replay runtime contract is unchanged (strict footer hash requirement remains enforced).
- Fix is isolated to test typing and does not alter production code paths.
