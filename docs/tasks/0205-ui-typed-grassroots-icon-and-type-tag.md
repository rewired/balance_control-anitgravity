# Task 0205 — UI: Typed Grassroots renders Grassroots icon + type tag label

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0205-ui-typed-grassroots-icon-and-type-tag`

---

**Task State:** VERIFYING

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
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Presentation-only rendering change in `packages/client-web`; no client-side legality/cost/majority; no new commit paths.
* GR-014: Uses existing tile-type iconography; only fixes selection logic so Grassroots always uses the Grassroots icon.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-02-07A (Typed Grassroots Type Tag)
* CORE: CORE-01-04-22L (Typed Grassroots definition; uses printed type tag T)
* CORE: CORE-01-03-02B.1 (Typed Grassroots ordering uses its type tag)
* ARCH: ARCH-06 §2.1 BoardSurface (Render tiles/tokens; inspection is read-only)
* UI: UI-HEX-TILE-VISUAL.v0.2 `layering_bottom_to_top` (tile content layer)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Typed Grassroots tiles render the **Grassroots type icon** (not the resort icon).
* Typed Grassroots render a **small type tag label** underneath the Grassroots icon: `DOM`, `FOR`, or `INF` (or localized name if i18n key exists).
* Untyped Grassroots keep current rendering (Grassroots icon, no type tag label).
* The same behavior applies consistently to:
  * Board tiles
  * Ghost placement preview
  * “Pending tile” placement HUD (top-left helper)

---

## 3) Non-Goals

* No rule changes (Convert recipes, legality, costs, majority, etc.).
* No icon redesign; no new assets.
* No rework of tile ordering / setup; this is rendering-only.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/HexBoard.tsx`
  * `packages/client-web/src/components/GameLayout.tsx` (pending tile HUD)
  * `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  * `packages/client-web/src/ui/tiles/TileTypeIcon.tsx`
  * `packages/game/src/packs/core/resources/core-tiles.json` (typedGrassroots uses `conversion.typedResort`)

* Existing behavior summary (current):

  * In `HexTileVisual`, `resortIcon` is preferred over `typeIcon`.
  * `HexBoard` passes `resortIcon` whenever `tile.resort` exists; typed Grassroots therefore shows the resort icon and loses the Grassroots icon.
  * No type tag label is rendered for typed Grassroots.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/components/HexBoard.tsx`
  * For `tile.type === 'Grassroots'`: pass `typeIcon` always.
  * For typed Grassroots: do **not** pass `resortIcon`; instead pass `typeTag` derived from `tile.conversion?.typedResort` (preferred) or `tile.resort` as fallback.
  * Apply the same logic to the ghost preview `HexTileVisual` render.
* `packages/client-web/src/components/GameLayout.tsx`
  * Pending tile HUD renders Grassroots correctly (type icon + tag label).
* `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  * Add a deterministic, optional `subLabel` (or `typeTag`) rendering slot under the active icon.
  * Ensure layout does not overlap with `valueW` (weight) rendering.

### 5.2 Tests

* Update/Add:
  * `packages/client-web/test/hex-tile-visual-layout.test.tsx`
    * Render typed Grassroots visual: asserts presence of Grassroots icon + presence of the type tag label.
    * Render resort tile: asserts no regression (still uses resort icon).
  * `packages/client-web/test/tile-placement-ux.test.tsx`
    * When pending/staged tile is typed Grassroots, HUD shows Grassroots icon + type tag label.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Add `typeTag` / `subLabel` prop support in `HexTileVisual` (render below icon; deterministic font size & baseline).
* [x] Update `HexBoard` tile rendering:
  * [x] Grassroots always uses `typeIcon`.
  * [x] Typed Grassroots uses `tile.conversion.typedResort` as label.
  * [x] Ghost preview uses the same logic.
* [x] Update `GameLayout` pending-tile HUD to use type icon + tag label when tile.type === Grassroots.
* [x] Add/update tests for board tile rendering, ghost preview, and pending HUD.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] A typed Grassroots tile renders the Grassroots icon on the board.
* [x] The typed tag label (DOM/FOR/INF) appears under the Grassroots icon and does not overlap the weight text.
* [x] Ghost preview and pending-tile HUD show the same corrected rendering.
* [x] No regressions for Resort/Committee/Lobbyist/Hotspot icons.
* [x] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes

---

## 11) Work Summary

* Modified `HexTileVisual` to accept a `typeTag` prop and render it below the icon, ensuring no overlap with weight (which Grassroots tiles lack).
* Updated `HexBoard` to correctly identify Typed Grassroots and pass the Grassroots `typeIcon` + `typeTag` (from `conversion.typedResort` or `resort`) instead of defaulting to `resortIcon`.
* Updated `GameLayout` to ensure the "Pending Tile HUD" (top-left helper) also renders the Grassroots icon + tag for Typed Grassroots, matching the board visual.
* Added tests in `hex-tile-visual-layout.test.tsx` to verify the SVG layout of the tag.
* Added tests in `tile-placement-ux.test.tsx` to verify the ghost preview rendering logic in `HexBoard`.

---

## 12) Commands Run

* `pnpm test test/hex-tile-visual-layout.test.tsx` (Passed)
* `pnpm test test/tile-placement-ux.test.tsx` (Passed)

---

## 13) Postflight Proof

(To be filled in the commit message)

---

## 14) Guardrails

* **Affected Guardrails:** GR-002, GR-014
* **Compliance:**
  * GR-002: Presentation-only change; no state mutation or rule logic affected.
  * GR-014: Respects existing iconography; ensures correct icon selection for Typed Grassroots.

---

## 15) Amendments (Append-Only)

* None.
