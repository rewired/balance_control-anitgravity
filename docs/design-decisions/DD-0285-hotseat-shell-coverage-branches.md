# DD-0285 — HotseatShell coverage branch hardening for E2E + tripwire paths

## Status
Accepted — 2026-02-26

## Context
`HotseatShell.tsx` contains test-only E2E hook branches (`__BC_ENABLE_E2E_HOOKS__`) and a DEV-only tripwire mismatch indicator. Existing tests covered basic mount/unmount behavior but left branch gaps in:
- `setPendingChoice` / `clearPendingChoice` mutation guards and fallback player resolution.
- `getPendingChoiceKind` read-path.
- DESYNC badge rendering path once `onTripwireMismatch` is triggered.

The user requested explicit attention to this file’s coverage deficit.

## Decision
Extend `packages/client-web/test/hotseat-shell.smoke.test.tsx` with deterministic branch tests that:
1. Exercise full pending-choice E2E API lifecycle (read, set, clear).
2. Assert fallback behavior when `ctx.currentPlayer` is absent (active-seat fallback).
3. Assert no-op guard behavior when engine state is missing.
4. Trigger `onTripwireMismatch` from a test board stub and assert DESYNC badge render semantics.

## Consequences
- Coverage for `HotseatShell.tsx` increases on E2E and tripwire branches without changing runtime production semantics.
- UI remains presentation-only and aligned with ARCH-06 command-path/hard-gate contracts.
- Regression risk for test-only hooks and DEV diagnostics is reduced via explicit assertions.
