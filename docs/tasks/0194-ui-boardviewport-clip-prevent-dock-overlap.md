# Task 0194 — UI: Clip BoardViewport overflow (Dock can’t block board targets)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0194-ui-boardviewport-clip-prevent-dock-overlap`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only CSS/layout change in `packages/client-web`. No client-side legality/cost/majority logic, and no new commit paths.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 (YAML): `surfaces.ActionDock.responsibilities.confirm_cancel`
* ARCH-06 Checklist: `10) Visual/UX Minimums`

Rule:

* If no anchor supports the change → do not implement.

---

## 2) Goal

* Board content (tiles/targets/ghosts/preview) is **clipped to the viewport** and cannot visually “spill” into the ActionDock area.
* As a result, the dock cannot visually or interactively block board target selection due to overlap.
* Pan/zoom/fit/reset behavior remains unchanged.

---

## 3) Non-Goals

* No ActionDock redesign.
* No changes to `LegalIntent` enumeration, draft/confirm, PendingChoice rules.
* No geometry changes in HexTile visuals.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/index.css`
* `packages/client-web/src/components/BoardViewport.tsx` (verification only)
* `e2e/client-web/*` (Playwright)

### Current behavior (symptom)
* `.board-viewport` and `.board-viewport-wrapper` use `overflow: visible` (wrapper even uses `!important`), allowing board visuals to extend below into the dock area.

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/index.css`
  * Set `.board-viewport { overflow: hidden; }`
  * Set `.board-viewport-wrapper { overflow: hidden; }`
  * Remove `overflow: visible !important` from `.board-viewport-wrapper`

### 5.2 Tests
* Add: `e2e/client-web/css-boardviewport-overflow-hidden.spec.ts`
  * Navigate to `/?mode=online` and wait for lobby screen (fast; no match required).
  * Inject test elements:
    * `<div class="board-viewport" />`
    * `<div class="board-viewport-wrapper" />`
  * Assert computed style `overflow` is `hidden` on both.

### 5.3 Docs
* No docs changes required (UI-only).

---

## 6) Constraints (Hard)

* UI remains presentation-only (GR-002).
* No new direct commit paths (no `dispatchIntent`, no `moves.*` from components).
* No new user-facing strings without I18N.

---

## 7) Invariants (Must remain true)

* BoardSurface guided selection remains usable (valid targets stay interactable).
* Draft/confirm and PendingChoice hard-gate behavior unchanged.
* Pan/zoom/fit/reset still works.

---

## 8) Implementation Plan

* [ ] Update `index.css` overflow rules as described.
* [ ] Add the Playwright CSS regression test.
* [ ] Manually verify: in game, nothing visually extends into the dock area.

---

## 9) Acceptance Criteria

* [ ] `.board-viewport` and `.board-viewport-wrapper` compute to `overflow: hidden`.
* [ ] The new e2e test passes.
* [ ] `pnpm lint`, `pnpm test`, and `pnpm e2e` are green.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] `pnpm lint` passes
* [ ] `pnpm test` passes
* [ ] `pnpm e2e` passes
* [ ] Determinism proof — N/A (UI-only)
* [ ] No temporary files committed
* [ ] `CHANGELOG.md` update — N/A (UI-only)

---

## 11) Work Summary (3–7 bullets)

* <to be filled during IMPLEMENTING>

---

## 12) Commands Run (with outcomes)

* <to be filled during VERIFYING>

---

## 13) Postflight Proof (recorded in commit message)

* <to be filled at COMMIT_READY>

---

## 14) Commit Proof (recorded in commit message)

* <to be filled at COMMIT_READY>

---

## 15) Amendments (append-only)

* (none)
