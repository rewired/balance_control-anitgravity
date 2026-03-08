# DD-0346 — Replay sink close validation cleanup for deterministic test/runtime behavior

- **Status:** Accepted
- **Date:** 2026-03-08
- **Task:** 0346

## Context

`NdjsonReplaySink.close()` validates required footer preconditions (`finalStateHash`) before writing terminal footer records. Recent strict footer validation made several server replay tests fail, and exposed unhandled stream errors in tests that intentionally trigger close-time validation failures.

The failure mode was: close validation throws before stream finalization, while the test cleanup removes temporary directories; pending stream open/write emits asynchronous `ENOENT` errors.

## Decision

1. Keep strict close-time validation that rejects footer emission without a non-empty final state hash.
2. When close validation fails, explicitly destroy all open replay streams and clear in-memory stream registry before throwing.
3. Update server replay tests to always provide `stateHash` when asserting successful close+footer flows.
4. Keep a dedicated negative test for missing footer hash, but wait briefly for async stream events to settle before test teardown.

## Consequences

- Deterministic replay contract remains strict: no synthetic fallback footer hashes.
- Error handling is cleaner and avoids asynchronous resource leaks/unhandled errors.
- Server replay tests align with the stricter replay footer contract and pass in workspace runs.
