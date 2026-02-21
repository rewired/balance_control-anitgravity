# Task 0183 — PG-6: ActionDock user strings → i18n keys

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0183-ui-actiondock-i18n-keys`
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

### compliance_notes
* GR-002: Refactor is string-only; ActionDock continues to select from existing `LegalIntent`s and never computes legality/costs.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `i18n.required_keys`
* ARCH-06: `surfaces.ActionDock.responsibilities`
* ARCH-06: `action_taxonomy.groups_order`
* ARCH-06 Checklist:
  * `1) No Auto-Commit`
  * `9) I18N`

---

## 2) Goal

* Replace all user-facing strings in `ActionDock.tsx` with `t(...)` calls.
* Ensure ActionDock uses **only** keys from `core` namespace (for now) and does not introduce new hardcoded UI strings.

---

## 3) Non-Goals

* No interaction logic changes.
* No changes to ordering/grouping behavior.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/ui/i18n/*` (Tasks 0181/0182)

### Existing behavior summary (current)
* Action/step labels and button text are hardcoded.

---

## 5) Outputs

### 5.1 Code

* Update `packages/client-web/src/components/ActionDock.tsx` to:
  * import `useT()` (or equivalent) from `src/ui/i18n`.
  * replace group headers:
    * Influence → `core:group.influence`
    * Committees → `core:group.committees`
    * Economy → `core:group.economy`
    * Measures → `core:group.measures`
    * Expansions (Other) → `core:group.expansions`
  * replace action labels:
    * Place Influence → `core:action.placeInfluence`
    * Move Influence → `core:action.moveInfluence`
    * Formalize Influence / Formalize → `core:action.formalize`
    * Convert Resources / Convert → `core:action.convert`
    * Take Measure → `core:action.takeMeasure`
  * replace step labels (choose action/source/destination/tile/variant):
    * `core:step.chooseAction`, `core:step.chooseSource`, `core:step.chooseDestination`, `core:step.chooseTile`, `core:step.chooseVariant`
  * replace Preview/Confirm/Cancel/edit buttons:
    * `core:ui.preview`, `core:ui.confirm`, `core:ui.cancel`, `core:ui.changeSource`, `core:ui.changeDestination`, `core:ui.changeVariant`
  * refactor draft summaries to use templates:
    * Move influence summary: `core:draft.moveInfluenceSummary` with `{ source, target }`
    * Place influence summary: `core:draft.placeInfluenceSummary` with `{ target }`
    * Place tile summary: `core:draft.placeTileSummary` with `{ tile, coord }`
    * Formalize summary: `core:draft.formalizeSummary` with `{ tile }`
    * Convert summary: `core:draft.convertSummary` with `{ tile }`

Notes:

* Keep `data-testid` stable.
* If ActionDock has additional visible strings (e.g. “Actions”, “Waiting”, “Draw & Place”, “Skip placement”, “Staged”), add them as `core:*` keys and use `t(...)`.
* Do not use dynamic string concatenation for user-visible labels when a key exists.

### 5.2 Tests

Update/extend ActionDock UI tests to assert the **keys resolve** (not the raw key string):

* `packages/client-web/test/action-dock.test.tsx`
  * add at least one assertion that the Confirm/Cancel buttons use translated text.
  * add at least one assertion that the group header uses translated text.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* No direct commit calls from ActionDock (ARCH-06 checklist).
* No new hardcoded user-visible strings in ActionDock.

---

## 7) Invariants (Must remain true)

* During `draftReady`, the action selection list remains hidden (existing contract behavior).
* No behavior change to action selection, drafting, or confirm/cancel.

---

## 8) Implementation Plan

* [ ] Step 1: Wire `useT()` at top of ActionDock and thread `t` into helper functions.
* [ ] Step 2: Replace the label helpers (`getActionLabel`, `getStepLabel`, `formatIntentLabel`) to use `t(...)` and the draft summary templates.
* [ ] Step 3: Replace UI strings in markup (group headers, button labels, header text).
* [ ] Step 4: Update tests.
* [ ] Step 5: Run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] ActionDock renders with no hardcoded user-facing strings (all visible labels come from `t(...)`).
* [ ] Contract required keys are used where applicable.
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately (GR-002).
* [ ] Normative anchors cited.
* [ ] No engine/rule/spec changes.
* [ ] `pnpm lint` passes.
* [ ] `pnpm -C packages/client-web test` passes.
