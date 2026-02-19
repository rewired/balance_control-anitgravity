# Codex Task 0143 — INTEGRATION: Add a deterministic golden fixture regenerator (`golden:update`)

**Date:** 2026-02-19  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0143
- **Owner:** Codex
- **Area:** `packages/integration-tests` (scripts + test fixtures)
- **Priority:** P1
- **Risk:** Low (tooling-only; writes fixtures deterministically)
- **Branch name:** `task/0143-integration-tests-add-golden-regenerator`

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** regen output must be stable for a given code+fixtures.
- **GR-012 (Match Config is Canonical):** regen must honor fixture-provided config.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-012
- `packages/integration-tests/test/golden-replay.test.ts` — authoritative replay semantics
- `packages/game/src/hash-state.ts` — canonical state hashing

## 3) Context (frozen)

Golden hashes should be updated **mechanically**, not by hand:

- Hand-editing `expectedFinalHash` is error-prone.
- We need a repeatable way to re-baseline fixtures *when* intentional, spec-anchored changes occur.

This task adds a small Node script that replays fixtures and rewrites only the expected hash fields.

## 4) Goal (frozen)

- Add `pnpm -C packages/integration-tests golden:update` to regenerate golden hashes deterministically.
- Add `pnpm -C packages/integration-tests golden:check` to fail if fixtures are stale.

## 5) Scope (frozen)

### 5.1 In-scope

- Add script file:
  - `packages/integration-tests/scripts/update-golden.mjs`
- Add package scripts to `packages/integration-tests/package.json`:
  - `golden:update` (writes)
  - `golden:check` (no writes; exits non-zero if mismatch)
- Script behavior:
  - Load all `*.json` from `packages/integration-tests/test/golden/` (sorted).
  - For each fixture:
    - register canonical packs via `registerCanonicalPacks()`.
    - replay moves via boardgame.io `Client`.
    - compute:
      - `expectedFinalHash` via `hashState(G)` from `@balance-control/game`
      - `expectedPublicSurfaceHash` via `G.meta.publicSurfaceHash`
    - compare to file.
  - In update mode: rewrite only `expectedFinalHash` and `expectedPublicSurfaceHash`.
  - Write JSON with stable formatting (2-space indent, trailing newline, stable key order).

### 5.2 Out-of-scope

- Adding new fixtures or changing move lists.
- Changing replay semantics or hashing implementation.

## 6) Plan (frozen)

### Entry criteria

- Task 0142 merged (integration-tests has real fixtures under `test/golden/`).

### Steps

1) **Implement regenerator script**
   - Create `packages/integration-tests/scripts/update-golden.mjs`.
   - Support modes:
     - `--write` (default for `golden:update`): rewrites fixtures.
     - `--check` (default for `golden:check`): verifies without writing.

2) **Stable JSON writer**
   - Implement a small `sortKeysDeep(value)` helper so key ordering is deterministic.
   - Use `JSON.stringify(sortKeysDeep(obj), null, 2) + '\n'`.

3) **Wire package scripts**
   - Add to `packages/integration-tests/package.json`:
     - `"golden:update": "node scripts/update-golden.mjs --write"`
     - `"golden:check": "node scripts/update-golden.mjs --check"`

4) **Verify**
   - `pnpm -C packages/integration-tests golden:check` (should pass on clean tree)
   - `pnpm -C packages/integration-tests golden:update` (should be a no-op when already current)
   - `pnpm -C packages/integration-tests test`

### Exit criteria

- `golden:check` fails on mismatch and succeeds when fixtures match.
- `golden:update` produces deterministic output and does not thrash files.

## 7) Acceptance Criteria (frozen)

- `packages/integration-tests/scripts/update-golden.mjs` exists and works.
- `pnpm -C packages/integration-tests golden:check` passes on current fixtures.
- `pnpm -C packages/integration-tests golden:update` is idempotent.

## 8) Files likely touched (frozen)

- `packages/integration-tests/scripts/update-golden.mjs` (new)
- `packages/integration-tests/package.json`
- `packages/integration-tests/test/golden/*.json` (only when updating expected hashes)

## 9) Notes / hazards (frozen)

- The script must use **only public entrypoints** (`@balance-control/game`, `@balance-control/packs`, `@balance-control/rules`).
- Do not swallow console errors silently in regen mode; if the replay throws, fail loudly.

## 10) PR Checklist (to be completed before merge)

- [ ] Integration tests pass (`pnpm -C packages/integration-tests test`)
- [ ] `golden:check` passes
- [ ] `golden:update` is idempotent
- [ ] No rules changes (SPEC-anchored)
- [ ] Updated docs/hand-off/current.md if any fact/decision changed

## 11) Work Summary (fill after implementation)

-

## 12) Commands Run (fill after implementation)

-

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-
