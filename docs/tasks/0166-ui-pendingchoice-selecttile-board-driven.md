# Task 0166 — PG-2: PendingChoice kind=selectTile is board-driven (no blocking overlay)

Status: DRAFT

## Meta
- Owner: Codex
- Area: PendingChoice hard-gate UX (selectTile exception)
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-check ARCH-06 pendingChoice section:
   - Hard-gate semantics
   - `selectTile` is board-driven and must not be blocked by a modal
3. [ ] Baseline tests:
   - `pnpm -C packages/client-web test`

## 1) Goal
When `G.engine.pendingChoice.kind === 'selectTile'`:
- BoardSurface becomes the interaction surface for resolving the choice.
- Clicking a valid tile immediately dispatches exactly one `resolveChoice`.
- The blocking `PendingChoiceModal` overlay must not prevent board selection.

For all other pendingChoice kinds:
- Keep existing modal-driven behavior (misclick-safe) unchanged.

## 2) Inputs
- Contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md` (Section 6)
- UI code:
  - `packages/client-web/src/components/GameLayout.tsx` (wiring)
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/ModalHost.tsx` (minimal conditional rendering only)
  - `packages/client-web/src/components/PendingChoiceModal.tsx` (ONLY if needed; avoid redesign)
- Tests:
  - `packages/client-web/test/pending-choice-modal.test.tsx`

## 3) Outputs
### 3.1 Board-driven resolveChoice
- In `GameLayout`, detect `pendingChoice.kind === 'selectTile'`.
- Provide BoardSurface with:
  - a list of valid tileIds derived from `vm.pendingChoice.resolveChoice` intents (engine-provided).
  - an `onResolveChoice(intent)` callback that calls `controller.resolveChoice(intent)`.
- In `HexBoard`, in this mode:
  - highlight selectable tiles
  - clicking a selectable tile dispatches `resolveChoice` immediately
  - clicking any other tile does nothing (no inspect; hard-gate)

### 3.2 Modal bypass (minimal)
- Ensure the `PendingChoiceModal` overlay is NOT rendered for `pendingChoice.kind === 'selectTile'`.
  - Minimal implementation preference: conditional render in `ModalHost`.
  - Do not change modal UI for other kinds.

### 3.3 Tests
- Update `pending-choice-modal.test.tsx` with a new test for `kind=selectTile`:
  - Setup: state with `engine.pendingChoice.kind='selectTile'`, two board tiles, enumerateLegalIntents returns resolveChoice intents with `selection` equal to one of the tileIds.
  - Expect:
    - `pending-choice-overlay` is NOT present
    - selectable tile has a highlight class
    - clicking selectable tile calls `moves.resolveChoice` once with `{ choiceId, selection: <tileId> }`
    - clicking non-selectable tile does not dispatch.

## 4) Constraints
- GR-006 hard gate: while pendingChoice exists, only resolveChoice should be possible.
- GR-002: do not compute legality; use resolveChoice intents from enumeration.
- No engine/rule/spec changes.

## 5) Acceptance Criteria
- [ ] `pendingChoice.kind === 'selectTile'` can be resolved via board click (no modal blocker).
- [ ] `resolveChoice` dispatches exactly one move.
- [ ] Other pendingChoice kinds still use modal overlay as before.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/GR-006).
- [ ] No engine/rule/spec changes.
- [ ] No additional move commit paths added.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- TBD

## 8) Commands Run
- TBD
