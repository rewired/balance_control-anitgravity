# Task 0179 — PG-5: Measures are draft→confirm and dock-editable

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0179-ui-measures-draft-confirm-edit`
**Skills:** S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DRAFT

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
* GR-002: Measure selection remains intent-picking only; no client-side legality/cost logic added.
* GR-005: No new measure actions; only UI flow improvements for existing `*.takeMeasure` intents.
* GR-006: No changes to hard-gate behavior.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `action_taxonomy.core_action_types.core.measures`
* ARCH-06: `commit_policy.normal_moves.require_explicit_confirm`
* ARCH-06: `draft_rules.edit_semantics.dock_only`
* ARCH-06: `interaction_state_machine.invariants.draft_parameter_changes_are_dock_only`
* ARCH-06: `surfaces.ActionDock.responsibilities.confirm_cancel`

---

## 2) Goal

* Ensure **Take Measure** always follows: select measure → **draftReady** → Confirm/Cancel in dock.
* Add a dock-only **Change selection** control for drafted `*.takeMeasure` intents (no need to Cancel entire action session).

---

## 3) Non-Goals

* No changes to measure grouping logic beyond what’s required for the edit flow.
* No new measure preview simulation or consequence UI.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/components/MeasureTray.tsx`
* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
* `packages/client-web/src/ui/interaction/types.ts`

### Existing behavior summary (current)
* Selecting a measure calls `proposeIntent` (draft), but in `draftReady` there is no explicit “Change selection” affordance for `*.takeMeasure` drafts.

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/components/ActionDock.tsx`
  * In `CurrentActionPanel` draft edit controls:
    * Detect `draft.intent.moveType.endsWith('.takeMeasure')`.
    * Show a “Change selection” button (stable `data-testid`).
    * Reuse existing dock-only edit handler (preferred), or add a dedicated one.
* (Only if necessary) `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  * If adding a new edit handler, it must only clear draft/pins and must not commit.

### 5.2 Tests
* `packages/client-web/test/action-dock.test.tsx`
  * Add a test: clicking a measure button calls `proposeIntent(intent)` exactly once.
  * Add a test: `draftReady` with intent `exp01.takeMeasure` shows “Change selection” and calls the edit handler.

### 5.3 Docs
* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* No auto-commit: selecting a measure must never call `confirmDraft` implicitly.
* Draft edits remain dock-only.

---

## 7) Invariants (Must remain true)

* During `draftReady`, action group list is hidden.
* If a drafted intent is no longer legal, Confirm remains disabled (existing behavior).

---

## 8) Implementation Plan

* [ ] Step 1: Update `CurrentActionPanel` edit controls for `*.takeMeasure` drafts.
* [ ] Step 2: Add stable `data-testid`, e.g. `btn-edit-measure-selection`.
* [ ] Step 3: Extend ActionDock tests for measure selection and edit behavior.
* [ ] Step 4: Run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] Take Measure always drafts and requires Confirm.
* [ ] Drafted Take Measure offers “Change selection” in dock.
* [ ] Tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails listed + compliant
* [ ] Anchors cited
* [ ] `pnpm lint` passes
* [ ] `pnpm -C packages/client-web test` passes

---

## 11) Work Summary (3–7 bullets)

* <fill during implementation>

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → …
* `pnpm -C packages/client-web test` → …

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
