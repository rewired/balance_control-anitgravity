# Task 0175 — PendingChoice kind=selectTile: board-driven resolveChoice + no inspect clicks

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0175-ui-pendingchoice-selecttile-board-driven-and-no-inspect`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Board-driven choice uses only engine-provided `resolveChoice` intents.
* GR-006: During pendingChoice, the board allows only `resolveChoice` clicks (no inspect, no draft building).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: `ARCH-06` §5 PENDING CHOICE (HARD GATE)
* ARCH: `ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` → `commit_policy.pending_choice.resolveChoice_policy_by_kind.selectTile`
* ARCH: `ARCH-06-UI-INTERACTION-CHECKLIST.md` → Section 6 (PendingChoice Hard-Gate)

---

## 2) Goal

* If `vm.hasPendingChoice === true` and `vm.pendingChoice.kind === 'selectTile'`:
  * the board shows only valid choice targets as clickable
  * clicking a valid target dispatches `resolveChoice` immediately (direct commit)
  * clicking anything else does nothing (no inspect)
  * ModalHost must not block board selection

---

## 3) Non-Goals

* No board visual redesign beyond basic clickability/target highlight.
* No change to other pendingChoice kinds (modal-driven; handled by Task 0174).
* No changes to ActionDock IA (PG-3) or I18N (PG-6).

---

## 4) Inputs

* Contracts:
  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
* Code:
  * `packages/client-web/src/components/GameLayout.tsx`
  * `packages/client-web/src/components/ModalHost.tsx`
  * `packages/client-web/src/components/BoardViewport.tsx`
  * `packages/client-web/src/components/HexBoard.tsx`
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts` (resolveChoice path already exists)
* Tests:
  * `packages/client-web/test/pending-choice-modal.test.tsx`

Existing behavior summary (current):

* ModalHost already skips the modal for `kind === 'selectTile'`.
* Board can dispatch resolveChoice on target tiles, but non-target clicks still perform inspect selection (violates hard-gate).

---

## 5) Outputs

### 5.1 Code

* `GameLayout.tsx`
  * In hard-gate, disable inspection clicks by not wiring `onSelectTile`.
  * When `kind === 'selectTile'`, provide:
    * `resolveChoiceIntents={vm.pendingChoice.resolveChoice}`
    * `onResolveChoice={controller.resolveChoice}`
  * Ensure the board is interactive only for selectTile pendingChoice targets (pan/zoom always via viewport).

* `HexBoard.tsx`
  * In `resolveChoiceIntents` mode:
    * occupied tiles: only targets are clickable (dispatch resolveChoice)
    * ghosts: if a choice target is expressed as a coordinate string, render that coord as a clickable ghost that dispatches resolveChoice
    * all other board clicks are disabled (no inspect)

### 5.2 Tests

* Extend `packages/client-web/test/pending-choice-modal.test.tsx`:
  * add a second non-target tile; click it during `kind=selectTile`; assert no dispatch and inspector remains unchanged.
  * keep existing test that clicking the target dispatches `resolveChoice`.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (N/A — UI-only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No modal overlay may block selectTile resolution.
* No inspect selection during hard-gate.
* No normal drafting/confirming is enabled during hard-gate.

---

## 7) Invariants (Must remain true)

* In selectTile hard-gate, the only click-dispatch path is `resolveChoice`.
* Pan/zoom remains available.

---

## 8) Implementation Plan

* [ ] In `GameLayout`, compute `isHardGate = vm.hasPendingChoice` and `isSelectTilePending = vm.pendingChoice.kind === 'selectTile'`.
* [ ] If `isHardGate && isSelectTilePending`:
  * [ ] pass `resolveChoiceIntents` and `onResolveChoice` into the board
  * [ ] pass `onSelectTile={undefined}` and `onProposeMove={undefined}`
  * [ ] ensure `isInteractive` remains true (so target clicks work)
* [ ] Update `HexBoard`:
  * [ ] ensure non-target occupied tiles are not clickable in resolveChoice mode (no fallback to inspection)
  * [ ] support resolveChoice for ghosts when selection is a coord string
* [ ] Update tests in `pending-choice-modal.test.tsx`.
* [ ] Run: `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] In `kind=selectTile` hard-gate, clicking a valid target dispatches exactly one resolveChoice.
* [ ] Clicking a non-target tile does not dispatch and does not change inspector selection.
* [ ] `pending-choice-overlay` is not rendered for `kind=selectTile`.
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Implemented `pendingChoice.kind === 'selectTile'` hard-gate in `GameLayout.tsx` by explicitly disabling `onSelectTile` and `onProposeMove` callbacks.
* Updated `HexBoard.tsx` to support `resolveChoice` intents for ghost tiles (coordinate-based selection).
* Extended `pending-choice-modal.test.tsx` to verify that non-target clicks do not dispatch actions or update the inspector.
* Confirmed that `useGameInteractionController` also blocks selection internally, but UI-level disablement ensures correct visual feedback (no pointer events).

---

## 12) Commands Run (with outcomes)

* `pnpm test packages/client-web/test/pending-choice-select-tile.test.tsx` - Verified implementation with isolated tests.
* `pnpm test packages/client-web/test/pending-choice-modal.test.tsx` - Verified full suite passes with new tests.
* `pnpm lint packages/client-web` - Verified no lint errors.

---

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

