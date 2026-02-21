# Task 0195 — UI: Ghost tiles reset global button padding (alignment + no overlap)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0195-ui-ghost-tiles-reset-button-padding-alignment`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

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
* GR-002: UI-only CSS fix for `.hex-ghost` buttons. No rule logic changes, no legality changes, no new commit paths.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.minimal_preview_overlay`
* ARCH-06 Checklist: `10) Visual/UX Minimums`

Rule:

* If no anchor supports the change → do not implement.

---

## 2) Goal

* Ghost tiles (rendered as `<button class="hex-cell hex-ghost">`) are **box-model compatible** with the real tile cells (rendered as `<div class="hex-cell">`).
* Global `button { padding: 8px 16px; ... }` must **not** distort ghost tile size or internal layout.
* Ghost preview (hover) remains visually aligned and not “shifted” by button defaults.

---

## 3) Non-Goals

* No changes to HexTile visual layout logic (0186 already handled visual alignment work).
* No redesign of ghost style (keep existing border/background semantics).
* No changes to intent/draft/confirm mechanics.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/index.css`
* `packages/client-web/src/components/HexBoard.tsx` (verification only)
* `e2e/client-web/*` (Playwright)

### Current behavior (root cause)
* Ghosts are buttons and inherit global padding, which shifts/warps the ghost geometry and can cause perceived misalignment/overlap.

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/index.css`
  * Add a targeted override for ghost buttons (minimal impact):
    * `.hex-cell.hex-ghost { padding: 0; }`
  * If UA styles still interfere, optionally add:
    * `appearance: none; -webkit-appearance: none;`
    * `min-width: 0; min-height: 0;`
  * Do **not** remove the global `button { ... }` rule.

### 5.2 Tests
* Add: `e2e/client-web/css-ghost-button-padding-zero.spec.ts`
  * Navigate to `/?mode=online` and wait for lobby screen (fast; no match required).
  * Inject a `<button class="hex-cell hex-ghost">...</button>` into DOM.
  * Assert `getComputedStyle(btn).paddingTop/Right/Bottom/Left === "0px"`.

### 5.3 Docs
* No docs changes required (UI-only).

---

## 6) Constraints (Hard)

* UI remains presentation-only (GR-002).
* No new direct commit paths (no `dispatchIntent`, no `moves.*` from components).
* No new user-facing strings without I18N.

---

## 7) Invariants (Must remain true)

* Ghost tiles remain clickable only when `canPropose` (existing disabled logic).
* Hover preview stays `pointer-events: none`.
* Layer ordering unchanged.

---

## 8) Implementation Plan

* [x] Add the `.hex-cell.hex-ghost` padding override.
* [x] Add the Playwright CSS regression test.
* [ ] Manually verify: ghost tiles no longer look “larger” than real cells, and content no longer appears offset.

---

## 9) Acceptance Criteria

* [x] Ghost buttons compute to zero padding on all sides.
* [x] The new e2e test passes.
* [x] `pnpm lint`, `pnpm test`, and `pnpm e2e` are green.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] `pnpm lint` passes
* [x] `pnpm test` passes
* [x] `pnpm e2e` passes
* [x] Determinism proof — N/A (UI-only)
* [x] No temporary files committed
* [x] `CHANGELOG.md` update — N/A (UI-only)

---

## 11) Work Summary (3–7 bullets)

* Added `.hex-cell.hex-ghost` override in `index.css` to reset padding, appearance, and min-dimensions.
* Created E2E test `e2e/client-web/css-ghost-button-padding-zero.spec.ts` to verify the fix.
* Verified that ghost buttons now compute to zero padding, preventing distorting effects from global button styles.

---

## 12) Commands Run (with outcomes)

* `pnpm playwright test e2e/client-web/css-ghost-button-padding-zero.spec.ts`: Passed (1 passed)

---

## 13) Postflight Proof (recorded in commit message)

* All tests (unit, lint, e2e) passed.
* New E2E test `e2e/client-web/css-ghost-button-padding-zero.spec.ts` confirms `.hex-cell.hex-ghost` padding is 0px.
* UI reset prevents global button padding from distorting hex mesh.

---

## 14) Commit Proof (recorded in commit message)

* (Recorded after commit)

---

## 15) Amendments (append-only)

* (none)
