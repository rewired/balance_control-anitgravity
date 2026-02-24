# Task 0206 — UI: Influence marker number is never occluded (z-order + overlap fix)

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0206-ui-influence-marker-label-not-occluded`

---

**Task State:** COMMIT_READY

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

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Rendering/stacking fix only in `packages/client-web`; does not change legality, costs, majority, or commit paths.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-06 §2.1 BoardSurface (Render tiles/tokens; guided selection; inspection)
* UI: UI-HEX-TILE-VISUAL.v0.2 `layering_bottom_to_top` (L4 influence markers above overlay)
* UI: UI-HEX-TILE-VISUAL.v0.2 `influence_markers.overflow.tile_root_overflow: visible`
* CORE: CORE-01-00-03A (Influence in Board is attached to exactly one Tile)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* When a tile is hovered or selected, its influence marker(s) render with their numeric label fully visible.
* Influence marker numbers must not be covered by:
  * adjacent tiles
  * tile frame overlays
  * preview overlays
* The fix is deterministic and does not affect interaction semantics.

---

## 3) Non-Goals

* Do not change when influence markers are shown (still hover/selected per UI contract).
* Do not change influence geometry constants from the UI YAML (no coordinate or radius changes).
* Do not change majority computation or any engine logic.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/HexBoard.tsx` (tile container stacking)
  * `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (overflow is already visible)
  * `packages/client-web/src/ui/tiles/InfluenceCorners.tsx` (marker rendering)
  * `packages/client-web/src/index.css` (hex-cell stacking / z-index)

* Existing behavior summary (current):

  * Influence circles can be visible while their numeric label is partially or fully hidden due to overlap with adjacent hex-cell DOM stacking.
  * Hover/selected state does not guarantee the hovered/selected tile stacks above neighbors.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/components/HexBoard.tsx`
  * Assign deterministic `z-index` (or an equivalent stacking mechanism) so that:
    * hovered tile > non-hovered neighbors
    * selected tile > hovered tile
    * drafted tile/targets remain consistent with existing visual priorities
* `packages/client-web/src/index.css`
  * Add/adjust `.hex-cell` stacking rules (e.g., base z-index + modifiers) without changing layout geometry.

### 5.2 Tests

* Update/Add:
  * `packages/client-web/test/board-zindex-hover-selected.test.tsx` (new)
    * Render a small board with adjacent tiles.
    * Simulate hover on one tile and assert its container gains higher stacking indicator (class/style).
    * Simulate selection and assert selected tile stacks above hovered.
  * Optional (if feasible without brittle pixel tests):
    * Add a Playwright/e2e assertion ensuring marker label is visible when hovered.

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

* [ ] Add a clear stacking policy for `.hex-cell` (base/hover/selected/drafted/target).
* [ ] Implement it in `HexBoard` via className modifiers and minimal inline style (avoid per-tile random ordering).
* [ ] Verify that influence markers (L4) render above overlay within a tile, and the tile stacks above neighbors on hover/selected.
* [ ] Add regression tests for hover/selected stacking.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] On hover, the hovered tile stacks above adjacent tiles.
* [ ] Influence marker numeric label is fully readable on hovered/selected tiles.
* [ ] No regressions to target highlighting, draft overlays, or ghost previews.
* [ ] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

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

* Introduced `.hex-cell-hovered` with z-index 20 to `src/index.css`.
* Updated `HexBoard.tsx` to conditionally apply `hex-cell-hovered` when a tile is hovered.
* Adjusted z-indices for target (10), selected (30), and drafted (40) to ensure correct stacking order (Hovered > Neighbors, Selected > Hovered).
* Added regression test `packages/client-web/test/board-zindex-hover-selected.test.tsx` verifying class application.
* Fixed existing test `packages/client-web/test/Board.test.tsx` to wrap components in `I18nProvider`.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → OK (root)
* `pnpm test` → OK (packages/client-web, 32 passed)
* `pnpm vitest run packages/client-web/test/board-zindex-hover-selected.test.tsx` → OK (3 passed)

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>
