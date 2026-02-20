# Codex Task 0148 — CORE: Rename Meta-Marker mode `PingPong` → `ReturnPenalty`

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0148
- **Owner:** Codex
- **Area:** CORE rules doc + engine state serialization + intent enumeration + costs/resolution
- **Priority:** P1
- **Risk:** Medium (state serialization string changes; golden fixtures must be updated)
- **Branch name:** `task/0148-core-rename-pingpong-to-return-penalty`

## 1) Guardrails (frozen)

- **GR-001 (Engine State Authority):** keep state JSON-serializable; rename only.
- **GR-003 (Determinism Contract):** identical move sequence → identical hash (after updating fixtures).
- **GR-004 (Single Legal Action Interface):** enumeration remains pure; only terminology changes.
- **GR-010 (No Downstream Breakage):** update all repo call sites, tests, and golden fixtures (no mixed-mode strings).

## 2) Spec anchors (frozen)

- `docs/rules/000-core.md`
  - `CORE-01-02-17E` (Meta-Marker mode domain)
  - `CORE-01-04-12A` (Move Meta-Marker Update)
  - `CORE-01-04-12B` (Ping-Pong Penalty rule — rename only)
- `docs/architecture/ARCH-02-STATE-SHAPE.md` (JSON state; enum/string stability expectations)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (engine-owned legality/costs; client is presentation-only)

## 3) Context (frozen)

The CORE spec and engine currently use the Meta-Marker mode value **`PingPong`** to represent the **anti “move-back-to-the-previous-source” penalty** for Influence moves.

The term “PingPong” is opaque in code and debug dumps.

**Snapshot note (from repo ZIP):** A search with regex for `ping.*pong` in `src/**` and `docs/rules/**` excludes `docs/rules/legacy/**` yields **24 results in 7 files**:

- `docs/rules/000-core.md`
- `packages/game/src/engine/legal-intents.ts`
- `packages/game/src/engine/resolver.ts`
- `packages/game/src/engine/resolver/costs.ts`
- `packages/game/src/moves/shared.ts`
- `packages/game/src/moves/stages/politicalAction.ts`
- `packages/rules/src/objects.ts`

We will rename the concept to **`ReturnPenalty`** (spec wording: “Return Penalty”), without changing mechanics.

This is a **terminology + serialization rename** only:

- no cost math change
- no legality change
- no resolver order change
- no UI behavior change beyond better labels

## 4) Goal (frozen)

- Replace the spec term **Ping-Pong / PingPong** with **Return Penalty / ReturnPenalty** in:
  - `/docs/rules/000-core.md`
  - all engine/rules source under `packages/**/src`
- Keep rule IDs and mechanics identical (only naming).
- Ensure **all tests and golden fixtures** are updated so CI stays green.

## 5) Scope (frozen)

### 5.1 In-scope

- Spec update:
  - `docs/rules/000-core.md`
    - bump `**Version:** 01` → `**Version:** 02`
    - rename:
      - `PingPong` → `ReturnPenalty`
      - “Ping-Pong Penalty” → “Return Penalty”
      - Update any descriptive strings accordingly.

- Engine + rules source rename (no behavior change):
  - `packages/rules/src/objects.ts`: update `mode?: 'PingPong' | 'Convert'` → `mode?: 'ReturnPenalty' | 'Convert'`
  - `packages/game/src/moves/shared.ts`: update `placeMetaMarkerOnTile(..., mode: 'PingPong' | 'Convert')`
  - `packages/game/src/moves/stages/politicalAction.ts`: update comparisons/assignments and comments
  - `packages/game/src/engine/legal-intents.ts`: update comparisons and consequence strings
  - `packages/game/src/engine/resolver.ts` + `packages/game/src/engine/resolver/costs.ts`:
    - rename option `includePingPongPenalty` → `includeReturnPenalty`
    - rename locals and comments accordingly

- Baseline file set to clean (matches the user’s `pong` search scope; legacy excluded):
  - `docs/rules/000-core.md`
  - `packages/game/src/engine/legal-intents.ts`
  - `packages/game/src/engine/resolver.ts`
  - `packages/game/src/engine/resolver/costs.ts`
  - `packages/game/src/moves/shared.ts`
  - `packages/game/src/moves/stages/politicalAction.ts`
  - `packages/rules/src/objects.ts`

- Tests + fixtures updates required by serialization rename:
  - Update any test assertions expecting `'PingPong'` to `'ReturnPenalty'`
  - Update golden fixture JSON state strings containing `'PingPong'` to `'ReturnPenalty'`
    - at minimum: `packages/integration-tests/test/golden/core_pingpong_meta_marker.json`
    - If other fixtures contain `PingPong`, update them as well.

- Docs:
  - `docs/changelog.md`: add an Unreleased entry noting serialization rename (breaking for stored replays/saves).

### 5.2 Out-of-scope

- Any mechanical rule changes.
- Any redesign of the Meta-Marker data model (e.g., switching to `armedEffect/armedFromTileId`).
- Editing historical task files under `docs/tasks/**` (append-only discipline).
- The legacy CORE snapshot `docs/rules/legacy/000-core-v1.0.26.md` (explicitly excluded).
- Renaming other legacy spec snapshots under `docs/rules/legacy/**`.

**Important constraint:** Do **not** rename the golden fixture filename `packages/integration-tests/test/golden/core_pingpong_meta_marker.json`, because it is referenced from existing historical task docs (which are out-of-scope). Only update its *contents* where required by the new serialized mode value.

## 6) Plan (frozen)

### Entry criteria

- Working tree clean.
- `pnpm -v` and `node -v` match repo expectations.
- You can run the repo tests locally.

### Steps

1) **Spec rename + version bump**
   - Edit `docs/rules/000-core.md`:
     - Version 01 → 02
     - Replace:
       - `PingPong` → `ReturnPenalty`
       - “Ping-Pong Penalty” → “Return Penalty”
     - Keep rule IDs (`CORE-01-04-12A/B`) unchanged.

2) **Source rename (packages/**/src)**
   - Replace all occurrences of `'PingPong'` string literal used for `MetaMarker.mode` with `'ReturnPenalty'`.
   - Rename the costs option:
     - `includePingPongPenalty` → `includeReturnPenalty`
   - Update all call sites accordingly.

3) **Update tests & fixtures**
   - Update unit tests expecting `'PingPong'`.
   - Update integration golden fixtures containing `'PingPong'` in state.

4) **Repo-wide verification**
   - User-equivalent scope check (case-insensitive), excluding the legacy file:
     - `grep -RIn -i "pong" docs/rules packages/**/src | grep -v "docs/rules/legacy/000-core-v1.0.26.md"` returns **no matches**.
   - Additionally:
     - `grep -RIn "PingPong" packages/**/src` returns **no matches**.
     - `grep -RIn "PingPong" docs/rules/000-core.md` returns **no matches**.

5) **Changelog entry**
   - Add one bullet to `docs/changelog.md` (Unreleased) explaining:
     - The Meta-Marker mode value changed from `PingPong` to `ReturnPenalty`.
     - Stored replays/saves containing the old value must be regenerated/migrated.

### Exit criteria

- `pnpm lint` passes.
- `pnpm test` (or repo’s canonical test command) passes.
- Golden replay test suite passes (after fixture updates).
- Spec version bumped; no remaining `PingPong` references in the scoped locations.

## 7) Acceptance Criteria (frozen)

- [ ] `docs/rules/000-core.md` uses **ReturnPenalty / Return Penalty** terminology and `**Version:** 02`.
- [ ] No `PingPong` references remain under `packages/**/src`.
- [ ] No `PingPong` references remain in `docs/rules/000-core.md`.
- [ ] A case-insensitive search for `pong` in `docs/rules/**` + `packages/**/src`, excluding `docs/rules/legacy/000-core-v1.0.26.md`, returns **no matches**.
- [ ] All tests pass.
- [ ] Golden fixtures updated so golden replay tests pass.
- [ ] `docs/changelog.md` has an Unreleased entry for this rename.

## 8) Files likely touched (frozen)

- `docs/rules/000-core.md`
- `docs/changelog.md`
- `packages/rules/src/objects.ts`
- `packages/game/src/moves/shared.ts`
- `packages/game/src/moves/stages/politicalAction.ts`
- `packages/game/src/engine/legal-intents.ts`
- `packages/game/src/engine/resolver.ts`
- `packages/game/src/engine/resolver/costs.ts`
- `packages/game/test/**` (as needed)
- `packages/integration-tests/test/golden/**` (as needed)

## 9) Notes / hazards (frozen)

- This is a **serialized string change**: any persisted game state / replay JSON containing `"PingPong"` will break unless migrated.
- Keep semantics identical. If you notice a mechanical mismatch while editing, STOP and open a separate DD doc + new task.

## 10) PR Checklist (to be completed before merge)

- [ ] Guardrails respected (GR-001/003/004/010)
- [ ] Spec anchors referenced; no rule semantics changed
- [ ] No edits to historical `docs/tasks/**` files (except adding this task file)
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Golden replays updated + passing

## 11) Work Summary (fill after implementation)

- 

## 12) Commands Run (fill after implementation)

- 

## 13) Postflight (fill after implementation)

- 

## 14) Patch Notes (fill after implementation)

- 
