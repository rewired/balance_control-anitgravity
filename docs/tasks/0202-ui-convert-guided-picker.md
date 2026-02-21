# Task 0202 — UI: Convert UX — replace long option list with guided picker (no “scroll-to-win”)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0202-ui-convert-guided-picker`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** COMPLETED

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only flow change. All options still come from `enumerateLegalIntents()`; we only change presentation and selection steps.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.ActionDock.responsibilities.dock_only_confirm_cancel`
* ARCH-06 Checklist: `No long, unstructured lists; selection should be guided and deterministic`

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

Convert currently displays a long, flat list of possibilities. Players must scan/scroll/search mentally. This is poor UX and will only get worse as variants expand.

---

## 3) Goal

Replace the long list with a guided, dock-first selection flow:

1) **Choose source tile** on the board (only valid targets clickable)  
2) **Choose category/family** (small set of cards/buttons)  
3) **Choose a variant** within the selected family (short list)  
4) **Confirm/Cancel in the dock** (dock-only)

Optional (nice but not required):
* Search box (client-side) for variant names
* “Recommended” section (must be deterministic and explainable, not ML)

---

## 4) Determinism Requirements

* Sorting must be deterministic and stable:
  * primary: family key
  * secondary: variant label key
  * tertiary: internal variant key
* Under-variants appear **only after** a valid tile is selected (no pre-listing).

---

## 5) Implementation Outline

1. Identify Convert wizard/component.
2. Replace “flat list render” with:
   * `families = groupConvertIntents(legalIntentsForSelectedTile)` (use existing grouping helper if present)
   * render families as buttons/cards in the dock
   * render variants only after family chosen
3. Keep selection states in the interaction controller (drafting) and commit via confirm only.

---

## 6) Tests

* Add a unit test for deterministic grouping + sorting (preferred).
* Add an e2e smoke test that:
  * selects a tile
  * chooses a family
  * chooses a variant
  * sees draft ready state (but does not auto-commit)

---

## 7) Constraints

* UI remains presentation-only (GR-002).
* No direct move dispatch from components.
* No new user-facing strings without i18n keys.

---

## 8) Acceptance Criteria

* [ ] Convert entry no longer shows a long flat list.
* [ ] Flow is guided: tile → family → variant → confirm.
* [ ] Sorting is deterministic.
* [ ] Confirm/Cancel remains dock-only.
* [ ] Baseline checks green.