# Codex Task 0144 — AUDIT: Run golden replays via integration-tests; remove engine-package golden replay

**Date:** 2026-02-19  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0144
- **Owner:** Codex
- **Area:** root `package.json`, `packages/game/test`, `packages/integration-tests/test`
- **Priority:** P1
- **Risk:** Low/Medium (test relocation; no rules changes)
- **Branch name:** `task/0144-audit-spec-use-integration-golden-and-remove-game-golden`

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** `audit:spec` must still enforce deterministic golden replay hashing.
- **GR-002 (Engine-only Rule Execution):** golden replays must run through engine public APIs and real pack registration.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-002, GR-003
- `docs/hand-off/task-packet-protocol.md` — tests must enforce determinism and prevent drift
- `packages/integration-tests/test/golden-replay.test.ts` — canonical public-API runner

## 3) Context (frozen)

Right now, the repo runs golden replays from **two places**:

- `packages/game/test/golden-replay.test.ts` (engine-package runner, internal imports)
- `packages/integration-tests/test/golden-replay.test.ts` (public API runner, currently intended)

Additionally, `pnpm run audit:spec` explicitly runs the engine-package golden replay test.

To keep the separation clean and future-proof:

- **Golden replays with real packs** should live in `packages/integration-tests`.
- The engine package test suite should remain focused on engine invariants and pack-agnostic testing.

## 4) Goal (frozen)

- Make `audit:spec` run golden replays via `packages/integration-tests`.
- Remove the now-redundant golden replay test + fixtures from `packages/game/test`.

## 5) Scope (frozen)

### 5.1 In-scope

1) Root script change
- Update root `package.json` `audit:spec`:
  - remove: `pnpm -C packages/game test -- golden-replay.test.ts`
  - add: `pnpm -C packages/integration-tests test -- golden-replay.test.ts`

2) Remove engine-package golden replay
- Delete:
  - `packages/game/test/golden-replay.test.ts`
  - `packages/game/test/golden/*`

### 5.2 Out-of-scope

- Changing hashing semantics.
- Adding new golden fixtures.

## 6) Plan (frozen)

### Entry criteria

- Task 0142 merged (integration-tests has real fixtures).
- Task 0143 merged (optional but recommended: `golden:check` exists).

### Steps

1) **Switch `audit:spec`**
   - Edit root `package.json` `audit:spec` to run integration golden replay instead of the engine-package golden replay.

2) **Remove engine-package golden**
   - Delete `packages/game/test/golden-replay.test.ts`.
   - Delete `packages/game/test/golden/` directory.

3) **Verify**
   - `pnpm -w test`
   - `pnpm run audit:spec`
   - (optional) `pnpm -C packages/integration-tests golden:check`

### Exit criteria

- `audit:spec` enforces golden replay via integration-tests.
- Engine-package golden runner is removed.

## 7) Acceptance Criteria (frozen)

- Root `audit:spec` runs `packages/integration-tests` golden replay.
- `packages/game/test` no longer contains `golden-replay.test.ts` or `test/golden/*` fixtures.
- `pnpm -w test` passes.
- `pnpm run audit:spec` passes.

## 8) Files likely touched (frozen)

- `package.json` (root)
- `packages/game/test/golden-replay.test.ts` (deleted)
- `packages/game/test/golden/*` (deleted)

## 9) Notes / hazards (frozen)

- Keep `audit:spec` ordering otherwise unchanged.
- If `audit:spec` becomes slower, that’s acceptable; it’s a correctness gate, not a dev loop.

## 10) PR Checklist (to be completed before merge)

- [x] `pnpm -w test` passes
- [x] `pnpm run audit:spec` passes
- [x] Golden replay enforcement remains in place (now via integration-tests)
- [x] No rules changes (SPEC-anchored)
- [ ] Updated docs/hand-off/current.md if any fact/decision changed

## 11) Work Summary (fill after implementation)

- Updated root `package.json` `audit:spec` to run the golden replay test from `packages/integration-tests` instead of `packages/game`.
- Removed redundant `packages/game/test/golden-replay.test.ts` and `packages/game/test/golden/` directory.
- Added `@balance-control/packs` to root `devDependencies` to fix module resolution for `verify:packs` script in `audit:spec`.
- Verified that `audit:spec` still enforces consistency across the engine and golden fixtures.

## 12) Commands Run (fill after implementation)

- `pnpm run audit:spec`
- `pnpm -w test`
- `Remove-Item -Recurse -Force packages/game/test/golden` (fix for Windows `rm -rf`)
- `pnpm install`

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-
