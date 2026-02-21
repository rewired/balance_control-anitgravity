# Task 0184 — PG-6: Inspector user strings → i18n keys

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0184-ui-inspector-i18n-keys`
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
* GR-002: Inspector remains read-only; this task only replaces strings.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `surfaces.Inspector.responsibilities`
* ARCH-06: `i18n.required_keys`
* ARCH-06 Checklist: `9) I18N`

---

## 2) Goal

* Replace user-facing strings in the Inspector surface with `t(...)`.
* Use contract-required keys for the action status block, and add `core:*` keys for remaining Inspector UI labels.

---

## 3) Non-Goals

* No changes to inspector layout/behavior.
* No new inspector interactions.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/components/InspectorActionStatus.tsx`
* `packages/client-web/src/components/GameLayout.tsx` (Inspector panel)

---

## 5) Outputs

### 5.1 Code

* Update `packages/client-web/src/components/InspectorActionStatus.tsx`:
  * Use `core:inspector.activeAction`, `core:inspector.step`, `core:inspector.pinnedSource`.
  * For action labels and steps, reuse:
    * `core:action.*`
    * `core:step.*`
    * `core:ui.confirm` (for `draftReady` step label)
  * If additional labels are needed (e.g. “Pinned tile”, “Resolve choice”, “None”), add them under `core.inspector.*` and use `t(...)`.

* Update the Inspector panel in `packages/client-web/src/components/GameLayout.tsx`:
  * Replace header/empty-state/field labels with `t(...)`.
  * Recommended additions under `core.inspector.*` (or `core.ui.*` where appropriate):
    * Inspector
    * No tile selected
    * Coord / Type / Resort / Weight
    * Influence / Resources / None

### 5.2 Tests

* Update `packages/client-web/test/selection-inspector.test.tsx`:
  * Adjust any text-based assertions that relied on hardcoded English.
  * Add at least one assertion that the InspectorActionStatus labels come from i18n (e.g. “Active action”, “Step”).

If other tests fail due to changed text (common), update them to use `data-testid` where possible.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Inspector must remain read-only and must not mutate interaction state.
* No new hardcoded user-visible strings in touched Inspector components.

---

## 7) Invariants (Must remain true)

* Inspector remains presentation-only (ARCH-06).

---

## 8) Implementation Plan

* [x] Step 1: Import `useT()` into Inspector components.
* [x] Step 2: Replace string literals with `t(...)` calls.
* [x] Step 3: Add any missing `core.*` keys to `en.json` and `de.json` (Task 0182 scope).
* [x] Step 4: Fix/adjust tests (prefer `data-testid`).
* [x] Step 5: Run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [x] InspectorActionStatus uses contract required keys.
* [x] Inspector panel has no new hardcoded user-visible strings.
* [x] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist

* [x] Guardrails listed accurately (GR-002).
* [x] Normative anchors cited.
* [x] No engine/rule/spec changes.
* [x] `pnpm lint` passes.
* [x] `pnpm -C packages/client-web test` passes.
