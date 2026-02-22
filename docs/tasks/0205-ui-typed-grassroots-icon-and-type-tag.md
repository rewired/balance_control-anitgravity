# Task 0205 — UI: Typed Grassroots renders Grassroots icon + type tag label

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0205-ui-typed-grassroots-icon-and-type-tag`

---

**Task State:** DRAFT

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

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

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

* [ ] Add `typeTag` / `subLabel` prop support in `HexTileVisual` (render below icon; deterministic font size & baseline).
* [ ] Update `HexBoard` tile rendering:
  * [ ] Grassroots always uses `typeIcon`.
  * [ ] Typed Grassroots uses `tile.conversion.typedResort` as label.
  * [ ] Ghost preview uses the same logic.
* [ ] Update `GameLayout` pending-tile HUD to use type icon + tag label when tile.type === Grassroots.
* [ ] Add/update tests for board tile rendering, ghost preview, and pending HUD.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] A typed Grassroots tile renders the Grassroots icon on the board.
* [ ] The typed tag label (DOM/FOR/INF) appears under the Grassroots icon and does not overlap the weight text.
* [ ] Ghost preview and pending-tile HUD show the same corrected rendering.
* [ ] No regressions for Resort/Committee/Lobbyist/Hotspot icons.
* [ ] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* <what changed>
* <why>

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → <ok/fail + details>
* `pnpm test` → <ok/fail + details>
* (optional) `pnpm vitest run <pattern>` → <ok/fail + details>

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
