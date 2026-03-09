# DD-0356 — Replay test fixture typing and manifest-only header metadata source

- **Date:** 2026-03-09
- **Status:** Accepted
- **Task:** 0356

## Context

`packages/server/src/replay-logging.test.ts` contained inline replay fixture writes with `as any` for manifest and action records. This reduced compile-time signal for replay boundary regressions and allowed accidental fixture drift.

In addition, we need explicit test evidence that replay header metadata (`seed`, `matchConfig`) is accepted only from manifest records, matching runtime guard behavior in replay logging.

## Decision

1. Replace inline `as any` test literals with strict fixtures:
   - `const manifestFixture: ReplayManifestRecord = ...`
   - `const actionFixture: ReplayActionRecord = ...`
2. Add compile-time-only replay variant matrix with `satisfies Record<string, ReplayRecord>` so every record variant processed by replay logging remains represented in typed form.
3. Add a negative test writing a non-manifest record carrying manifest-like fields (runtime-forged) and assert sink rejects it with missing required header metadata.

## Consequences

- Stronger TypeScript enforcement in replay sink tests without runtime production changes.
- Clear boundary proof that header metadata capture path is manifest-gated.
- Lower chance of silent replay schema drift in test setup code.
