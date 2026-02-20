# Task 0160 — PG-1: Dock-confirm for ALL normal drafts (remove MoveConfirmationModal from normal flow)

Status: DONE

## Meta
- Owner: Codex
- Area: UI interaction (commit path lockdown)
- Packages: `packages/client-web`
- Skills: S07 (UX Consistency), S05 (Boundary Check)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Confirm Task 0159 is merged (single commit path exists).
3. [x] Baseline scan (no edits yet):
   - `rg -n "MoveConfirmationModal" packages/client-web/src`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Align the UI with ARCH-06 “dock-only confirm” semantics for **normal moves**:
- Replace the normal draft confirmation modal with **ActionDock confirm/cancel controls**.
- Ensure there is still exactly one normal commit entrypoint: `controller.confirmDraft()`.
- Keep pendingChoice handling unchanged in this task (PendingChoiceModal stays).

## 2) Inputs
- Normative contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (Confirm lives in ActionDock)
- Current components:
  - `packages/client-web/src/components/ActionDock.tsx`
  - `packages/client-web/src/components/ModalHost.tsx`
  - `packages/client-web/src/components/MoveConfirmationModal.tsx`
  - `packages/client-web/src/components/GameLayout.tsx`

## 3) Outputs
### 3.1 Code
- Update `ActionDock` to render, when `controller.draft.intent` exists:
  - a small “Confirm” button (calls `controller.confirmDraft()`)
  - a small “Cancel” button (calls `controller.cancelDraft()`)
  - (Optional) a compact summary line (moveType + short label) using existing label helpers.
- Update `ModalHost` to stop rendering `MoveConfirmationModal` for normal drafts.
  - Keep `PendingChoiceModal` behavior as-is.
- Ensure *no auto-confirm* is introduced: drafting an intent must not call `confirmDraft()` implicitly.

### 3.2 Tests
- Update tests to reflect dock confirm instead of modal confirm:
  - `packages/client-web/test/action-dock.test.tsx`
  - any tests that referenced MoveConfirmationModal directly

### 3.3 Files touched
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/components/ModalHost.tsx`
- `packages/client-web/src/components/MoveConfirmationModal.tsx` (may remain in repo but unused for normal drafts)
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- No UI redesign beyond minimal buttons/labels required for confirm/cancel.
- Engine authority (GR-002): confirm must dispatch only the drafted `LegalIntent` (engine-provided).
- Pending choice gate (GR-006): while pendingChoice exists, normal confirm/cancel controls must not appear.

## 5) Acceptance Criteria
- [x] Normal drafts are confirmed/canceled only from ActionDock (no confirmation modal for normal moves).
- [x] `controller.confirmDraft()` is the only normal commit entrypoint.
- [x] When pendingChoice exists, ActionDock is not shown (existing behavior) and no normal drafts can be confirmed.
- [x] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005/006).
- [x] No engine/rule/spec changes.
- [x] No auto-commit introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.
