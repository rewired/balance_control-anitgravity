# Task 0180 — PG-5: Variants flow — selectingVariant is inspect-only + dock “Change tile” (Formalize/Convert)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0180-ui-variants-selectingvariant-inspect-only`
**Skills:** S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002
* GR-005
* GR-006

### compliance_notes
* GR-002: Interaction-only; legality stays engine-owned via `vm.intents`.
* GR-005: No new moves; only controls how UI pins/edits parameters.
* GR-006: Hard-gate remains authoritative; no normal session allowed while hard-gated.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `board_interaction_rules.selectingVariant.board_clicks.inspect_only`
* ARCH-06: `interaction_state_machine.invariants.draft_parameter_changes_are_dock_only`
* ARCH-06: `action_taxonomy.selection_ui.show_under_variants.only_after_valid_tile_selection`
* ARCH-06: `draft_rules.edit_semantics.dock_only`
* ARCH-06: `surfaces.ActionDock.responsibilities.edit_draft_params`

---

## 2) Goal

* In `interactionState === selectingVariant`, **board clicks are inspect-only**:
  * do not mutate pinned committee/grassroots selection
* Provide a dock-only escape hatch:
  * “Change tile” clears pinned committee/grassroots
  * returns to selectingParams without committing
  * keeps the current actionMode (Formalize / Convert)

---

## 3) Non-Goals

* No visual redesign beyond one small dock control.
* No changes to convert/formalize grouping helpers.
* No changes to pendingChoice UX.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
* `packages/client-web/src/ui/interaction/types.ts`
* `packages/client-web/src/components/ActionDock.tsx`
* Tests:
  * `packages/client-web/test/interaction-controller-machine.test.ts`
  * `packages/client-web/test/action-dock.test.tsx`

### Existing behavior summary (current)
* `selectTile(...)` only blocks side effects in `draftReady`; it does not enforce inspect-only behavior during `selectingVariant`.

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/ui/interaction/types.ts`
  * Add an explicit edit API, e.g. `editPinnedTile()` (name must be unambiguous).
* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  * When pinned committee/grassroots exists (i.e., selectingVariant), `selectTile(...)`:
    * updates `selectedTileId/selectedCoord`
    * does **not** update pinned IDs or other params
  * Implement `editPinnedTile()` to clear pinned committee/grassroots (and any variant-related transient state) without committing.
* `packages/client-web/src/components/ActionDock.tsx`
  * In `CurrentActionPanel`, when `interactionState === selectingVariant` and pinned tile exists:
    * show “Change tile” button with stable `data-testid`
    * call `controller.editPinnedTile()` on click

### 5.2 Tests
* `packages/client-web/test/interaction-controller-machine.test.ts`
  * Add test: in selectingVariant, calling `selectTile(...)` does not change pinned committee/grassroots.
* `packages/client-web/test/action-dock.test.tsx`
  * Add test: “Change tile” button is visible in selectingVariant and calls edit function once.

### 5.3 Docs
* [x] `/docs/changelog.md` updated — N/A (UI-only)
* [x] DD doc — N/A
* [x] ERRATA — N/A

---

## 6) Constraints (Hard)

* Dock-only edits: no board-driven parameter changes during selectingVariant.
* No auto-commit. No new commit paths.

---

## 7) Invariants (Must remain true)

* Under-variants are shown only after a valid tile is pinned.
* After “Change tile”, the user can pick a different valid tile and see variants again.

---

## 8) Implementation Plan

* [x] Step 1: Add explicit edit method in controller types.
* [x] Step 2: Implement method; clear pinned committee/grassroots.
* [x] Step 3: Enforce inspect-only in `selectTile` for selectingVariant.
* [x] Step 4: Add dock button + test ids.
* [x] Step 5: Update tests and run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [x] In selectingVariant, board clicks do not mutate pinned parameters (inspect-only).
* [x] Dock offers “Change tile” to return to selectingParams for Formalize/Convert.
* [x] Tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed + compliant
* [x] Anchors cited
* [x] `pnpm lint` passes
* [x] `pnpm -C packages/client-web test` passes

---

## 11) Work Summary (3–7 bullets)

* Added `editPinnedTile` to `InteractionController` interface and implementation.
* Updated `selectTile` to enforce inspect-only behavior when in `selectingVariant` state (i.e. pinned tile exists).
* Updated `ActionDock` to display "Change tile" button when in `selectingVariant` state.
* Added tests to verify inspect-only behavior and "Change tile" functionality in `interaction-controller-machine.test.ts` and `action-dock.test.tsx`.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → passed
* `pnpm -C packages/client-web test interaction-controller-machine action-dock` → passed

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
