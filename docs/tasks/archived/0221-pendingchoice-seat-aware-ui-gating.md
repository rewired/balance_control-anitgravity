# task(0221): PendingChoice + seat switching: prevent non-owner pendingChoice from disabling board interactions

- Date: 2026-02-22
- Owner: Codex
- Status: DRAFT
- Task Key: `task/0221-pendingchoice-seat-aware-ui-gating`

---

## 0) Guardrails Gate (MUST)

### affected_guardrails

* GR-002
* GR-006
* GR-005

*(OR write exactly: `NONE`)*

### compliance_notes (required if affected_guardrails != NONE)

- GR-002: This task only changes how the UI derives “pendingChoice mode” from state; no rule logic is added.
- GR-006: Hard-gate remains strict but becomes *seat-aware*: only the pendingChoice owner enters hard-gate.
- GR-005: Prevent UI from showing disabled/incorrect interaction states due to pendingChoice belonging to a different seat.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* docs/architecture/ARCH-03-MEASURE-CPU.md: PENDING CHOICE (ResolveChoice-only when pendingChoice exists)
* docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml: PendingChoice hard-gate + board-driven selectTile
* packages/game: enumerateLegalIntents() behavior when pendingChoice exists (must align UI gating)

---

## 2) Goal

- Fix UI gating so that a pendingChoice belonging to a different player never blocks inspection / hover / board interactivity for the currently active seat.
- Remove a class of hotseat “poisoned turn” bugs caused by `vm.pendingChoice.kind` being read from global state rather than seat-owned state.

---

## 3) Non-Goals

- No changes to engine pendingChoice semantics or choice enumeration.
- No changes to modal styling/layout.

---

## 4) Inputs

- Current behavior:
  - `packages/client-web/src/ui/useIntentViewModel.ts` reads `G.engine.pendingChoice.kind` and surfaces it as `vm.pendingChoice.kind` for *any* viewer.
  - `packages/client-web/src/components/GameLayout.tsx` uses `vm.pendingChoice.kind === 'selectTile'` to route board clicks to ResolveChoice and disable normal inspection.
  - In hotseat seat switching scenarios, this can disable clicks even when `vm.hasPendingChoice` is false for the active seat.

---

## 5) Outputs

### 5.1 Code
- Make `pendingChoiceKind` **seat-aware** in `packages/client-web/src/ui/useIntentViewModel.ts`:
  - Only expose `pendingChoiceKind` if `G.engine.pendingChoice.player === pid`.
  - Otherwise set it to `null`.
- Update `packages/client-web/src/components/GameLayout.tsx`:
  - Derive `isSelectTilePending` from `vm.hasPendingChoice && vm.pendingChoice.kind === 'selectTile'` (not from kind alone).
  - Ensure `onSelectTile` is only disabled when the active player is truly resolving a selectTile pendingChoice.
- (Optional) Add a small helper in ViewModel builder: `isPendingChoiceForPid`.

### 5.2 Tests
- Add a regression test:
  - Build a ViewModel where `G.engine.pendingChoice.kind='selectTile'` but `pendingChoice.player='0'` and `pid='1'`.
  - Assert `vm.pendingChoice.kind === null` (or that `GameLayout` keeps `onSelectTile` enabled for pid=1 when hasPendingChoice=false).

---

## 6) Constraints (Hard)

- Do not introduce alternative “pendingChoice detection” logic beyond checking `G.engine.pendingChoice.player`.
- Keep click routing deterministic; no timeouts.

---

## 7) Invariants (Must remain true)

- If `vm.hasPendingChoice` is false for the active seat, the board must behave as normal (inspect/ghost placement/intent proposal).
- If `vm.hasPendingChoice` is true, only ResolveChoice is possible; no other action proposals.

---

## 8) Implementation Plan

1) Patch `useIntentViewModel` to null-out pendingChoiceKind when not owned by pid.
2) Patch `GameLayout` gating to require `vm.hasPendingChoice` alongside kind checks.
3) Add regression tests for both:
   - non-owner pendingChoice does not block
   - owner pendingChoice still blocks and routes clicks

---

## 9) Acceptance Criteria

- [ ] Hotseat / seat-switch scenario: switching seats while the other player is resolving a pendingChoice does not disable the board for the active seat once they become currentPlayer.
- [ ] PendingChoice hard-gate behavior remains strict for the pendingChoice owner.
- [ ] `pnpm -C packages/client-web test` passes.

---

## 15) PR Checklist (to be filled during implementation)

- [x] Preflight: read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- [x] Engine/client boundary respected (ARCH-01)
- [x] Determinism preserved (no Date.now/Math.random)
- [x] Tests updated/added as needed and pass
- [x] Task file updated with Work Summary + Commands Run
- [x] Single meaningful commit with Postflight block

### Work Summary

- Make `pendingChoice.kind` seat-aware via `getPendingChoiceKindForPlayer()` so non-owner pendingChoice never disables board interactions.
- Gate select-tile hard-routing in `GameLayout` behind `vm.hasPendingChoice` to avoid poisoned-turn UI state when switching seats.
- Add a small unit test for seat-aware pendingChoice kind derivation.
- Update pendingChoice UI tests to include `pendingChoice.player` to match the engine contract shape.

### Commands Run

- `pnpm -C packages/client-web test` (FAIL; 5 failed: pendingChoice tests missing `pendingChoice.player`)
- `pnpm -C packages/client-web test` (PASS)
- `pnpm lint` (PASS)
- `pnpm test` (PASS)
