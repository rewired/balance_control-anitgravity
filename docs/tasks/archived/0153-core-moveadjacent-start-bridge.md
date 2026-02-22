# Task 0153 — Implement CORE MoveAdjacent (incl. Start-Bridge) in Engine + Client

Status: DONE

## Meta
- Owner: Codex
- Area: Rules implementation / CORE
- Packages: `packages/game`, `packages/client-web` (if applicable)
- Skills: S01, S03, S04, S05, S07, S08
- affected_guardrails: GR-002, GR-003, GR-004, GR-010

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Replace `affected_guardrails: GR-TBD` above with the correct GR-xxx list (or `NONE`).
3. [x] Confirm the normative spec has these anchors (exact spellings):
   - `CORE-01-04-12`, `CORE-01-04-12D`
   - `CORE-01-08-06D`, `CORE-01-08-06E`
   - adjacency/topology anchors referenced by CORE topology section (use `spec-anchors.generated.json` as source of truth).
4. [x] Baseline scan (no edits yet):
   - `rg -n "PlaceOrMoveInfluence" packages/game` (or equivalent move name)
   - `rg -n "Adjacent\(" packages/game packages/client-web`
   - `pnpm test` (record outcome for Postflight)

## 1) Goal
Implement the updated CORE rule for moving Influence such that:
- Move targets are limited to `MoveAdjacent(source, destination)`.
- `MoveAdjacent` includes the Start Committee bridge case (`A—Start—B`) as defined by spec.
- Start Committee remains prohibited as source/destination.

## 2) Non-Goals
- No UI/UX redesign. Only the minimal highlight/selection legality updates required to match engine legality.
- No rule changes beyond the specified CORE anchors.
- No topology rewrites; reuse existing adjacency/topology primitives.

## 3) Inputs
- `/docs/rules/000-core.md` (updated rule text)
- `spec-anchors.generated.json`
- Existing move resolver + intent enumeration for Influence move

## 4) Outputs
- Engine legality and resolver enforce `MoveAdjacent`.
- Client-side legality/highlighting (if present locally) aligns with engine legality.
- Unit tests cover:
  - Direct adjacency move allowed.
  - Start-Bridge move allowed.
  - Non-adjacent, non-bridge move rejected.
  - Start Committee as source/destination rejected.

## 5) Constraints
- Determinism: no new non-deterministic inputs. (`@deterministic` where required.)
- Traceability: move resolver / legality / enumerator code must contain canonical spec bindings via `@rule` and/or `// <RULE_ID>` comments exactly matching anchors.
- No expansion coupling introduced into `@balance-control/game`.

## 6) Invariants
- Registry ordering / deterministic iteration order must not change.
- No behavior changes for unrelated moves.
- Golden fixtures remain deterministic.

## 7) Implementation Plan
1. Add a single canonical helper for Move-Adjacency in the engine layer (name it explicitly, e.g. `isMoveAdjacentViaStartBridge(...)` or `isMoveAdjacent(...)`).
   - The helper must use existing `Adjacent(...)` / topology functions.
   - It must implement the spec definition for the Start-Bridge case.
   - TSDoc must include:
     - `@rule CORE-01-04-12D`
     - `@rule CORE-01-08-06D`
     - `@rule CORE-01-08-06E`
     - `@deterministic`
     - `@pure` (or `@sideEffects` if truly necessary; prefer pure)
2. Update the Influence-move legality check (engine):
   - Destination must satisfy `MoveAdjacent(source,destination)`.
   - Reject if either source or destination is Start Committee.
3. Update the move resolver to validate again (defense-in-depth):
   - If invalid, resolve as a no-op error/invalid move according to existing engine conventions.
   - Ensure failure mode matches existing invalid-action handling patterns (do not invent new ones).
4. Update intent enumeration (server-side):
   - Only enumerate destinations that satisfy MoveAdjacent.
   - Ensure deterministic ordering of enumerated intents.
5. Update client highlighting/selection if it currently derives targets locally:
   - Use the same logic or query-based preview mechanism (whichever exists already).
   - The client must never present illegal Move targets.
6. Add/adjust tests:
   - Prefer small unit tests near topology/move logic.
   - Add one integration-ish test that executes the move and asserts the state change.
   - Update/remove any tests relying on long-range moves.

## 8) Acceptance Criteria
- Tests added/updated pass locally: `pnpm test`.
- Move legality exactly matches `MoveAdjacent` including Start-Bridge.
- All changed rule-resolving code has canonical `@rule` bindings to the anchors above.
- No new imports from `@balance-control/expansion-*` in `packages/game`.

## 9) PR Checklist (must complete in-task)
- [x] Updated this task file in `docs/tasks/` and checked boxes.
- [x] Guardrails listed accurately (GR-xxx or `NONE`).
- [x] Exactly one commit with correct message format.
- [x] Postflight appended to commit message (git status/diff/tests).
- [x] No dirty working tree after postflight amend.

## 10) Notes
- Prefer implementing Move-Adjacency once (engine), then reusing it for enumerators/resolvers.
- If the client has its own legality mirror, either reuse shared code or keep it minimal and consistent.
