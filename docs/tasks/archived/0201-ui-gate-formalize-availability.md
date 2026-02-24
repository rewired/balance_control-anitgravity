# Task 0201 — UI: Do not show “Formalize” as available when it isn’t (engine-driven gating)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0201-ui-gate-formalize-availability`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only change. Availability derives from engine-provided `enumerateLegalIntents()` output. No new commit paths.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.ActionDock.responsibilities.action_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 Checklist: `Action availability must reflect legality; avoid misleading affordances`

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

The ActionDock shows “Formalize” as an action even when Formalize is not currently legal / has no legal targets. This misleads the player and creates dead clicks.

---

## 3) Goal

* “Formalize” is **only selectable** when the engine reports at least one legal Formalize intent **right now**.
* If not legal, it must either be hidden or visibly disabled (your choice), but must not look like an available action.

---

## 4) Non-Goals

* No changes to legality rules.
* No changes to draft/confirm mechanics beyond UI gating.
* No modals.

---

## 5) Implementation Outline

1. Locate where the ActionDock builds its action group list (Influence / Committees / Economy / etc.).
2. Use the **current legal intent set** as the sole truth:
   * If `enumerateLegalIntents()` returns zero Formalize intents → Formalize action is disabled/hidden.
3. Ensure the same gating applies consistently:
   * action button disabled state
   * keyboard navigation (if any)
   * no wizard entry point for Formalize when illegal

---

## 6) Tests

Add or update a UI test (unit or e2e, whichever exists in repo conventions):

* Create a test scenario where no Formalize intents exist.
* Assert: Formalize is not selectable (not present or disabled).

Note: Do not add engine mocks that bypass the real intent enumeration surface unless that is already a standard test practice in this repo.

---

## 7) Constraints

* UI remains presentation-only (GR-002).
* No direct `dispatchIntent` from components; keep draft→confirm path intact.
* No new user-facing strings unless i18n is used.

---

## 8) Acceptance Criteria

* [x] When no Formalize intents are legal, Formalize is not selectable (hidden or disabled).
* [x] When Formalize is legal, it remains selectable and functions normally.
* [x] `pnpm lint`, `pnpm test` (and `pnpm e2e` if in baseline) are green.