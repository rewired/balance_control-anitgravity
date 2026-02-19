# Codex Task 0142 — INTEGRATION: Restore real golden replay fixtures under `packages/integration-tests`

**Date:** 2026-02-19  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0142
- **Owner:** Codex
- **Area:** `packages/integration-tests/test/golden`, `packages/integration-tests/test/golden-replay.test.ts`
- **Priority:** P1
- **Risk:** Low (test-only wiring; no rules changes)
- **Branch name:** `task/0142-integration-tests-restore-golden-fixtures`

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** golden replay asserts state hash stability.
- **GR-002 (Engine-only Rule Execution):** integration test must use engine public APIs; no client-side legality.
- **GR-012 (Match Config is Canonical):** fixtures must use canonical config surface (expansions flags or `packs.enabledPacks`).

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-002, GR-003, GR-012
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` — engine authority, pack registration model
- `packages/integration-tests/test/golden-replay.test.ts` — integration golden runner (public API)

## 3) Context (frozen)

We currently have **real** golden fixtures under `packages/game/test/golden/*`, while the integration runner in
`packages/integration-tests/test/golden-replay.test.ts` uses only a placeholder fixture (`dummy.json`).

That undermines the intended separation:

- **Engine tests** (`packages/game/test`) should stay pack-agnostic.
- **Real-pack golden replays** belong in `packages/integration-tests` using only public APIs (`@balance-control/game`, `@balance-control/packs`).

This task restores the **real** golden fixtures in the integration test package, without changing engine logic.

## 4) Goal (frozen)

- Replace the placeholder integration golden fixture(s) with the real fixture set.
- Ensure integration golden replay tests pass using the existing expected hashes.

## 5) Scope (frozen)

### 5.1 In-scope

- Move/copy golden fixture JSON files from:
  - `packages/game/test/golden/*.json`
  - → `packages/integration-tests/test/golden/*.json`
- Remove `packages/integration-tests/test/golden/dummy.json`.
- Keep the integration runner (`packages/integration-tests/test/golden-replay.test.ts`) as the canonical executor.

### 5.2 Out-of-scope

- Updating expected hashes (only if tests fail; otherwise leave unchanged).
- Deleting the engine-package golden tests/fixtures (handled in a follow-up task).
- Adding new fixtures that depend on expansions being enabled.

## 6) Plan (frozen)

### Entry criteria

- Current snapshot builds and tests are green.

### Steps

1) **Port fixtures to integration-tests**
   - Copy all `*.json` from `packages/game/test/golden/` into `packages/integration-tests/test/golden/`.
   - Delete `packages/integration-tests/test/golden/dummy.json`.

2) **Confirm runner picks them up**
   - Ensure `packages/integration-tests/test/golden-replay.test.ts` loads all `*.json` in `./golden` and iterates deterministically (sorted filenames).

3) **Verify**
   - Run `pnpm -C packages/integration-tests test`.

### Exit criteria

- Integration golden replay suite runs against the real fixtures and passes.

## 7) Acceptance Criteria (frozen)

- `packages/integration-tests/test/golden/` contains the real fixture set (no `dummy.json`).
- `pnpm -C packages/integration-tests test` passes.

## 8) Files likely touched (frozen)

- `packages/integration-tests/test/golden/*` (copy/add/remove)
- `packages/integration-tests/test/golden-replay.test.ts` (only if fixture loading needs adjustment)

## 9) Notes / hazards (frozen)

- Do **not** change move sequences in fixtures.
- Do **not** introduce rule logic changes; if hashes mismatch, prefer a dedicated regen tool (next task) over manual editing.

## 10) PR Checklist (to be completed before merge)

- [x] Integration tests pass (`pnpm -C packages/integration-tests test`)
- [x] No rules changes (SPEC-anchored)
- [x] Golden fixtures are deterministic and filenames are sorted
- [ ] Updated docs/hand-off/current.md if any fact/decision changed

## 11) Work Summary (fill after implementation)

- Ported `core_only_3p_2rounds.json`, `core_pingpong_meta_marker.json`, and `production_uncontrolled_produces_zero.json` from `packages/game/test/golden/` to `packages/integration-tests/test/golden/`.
- Deleted placeholder `dummy.json` in integration tests.
- Verified that `packages/integration-tests/test/golden-replay.test.ts` passes with these fixtures.

## 12) Commands Run (fill after implementation)

- `cp packages/game/test/golden/*.json packages/integration-tests/test/golden/`
- `rm packages/integration-tests/test/golden/dummy.json`
- `pnpm -C packages/integration-tests test`

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-
