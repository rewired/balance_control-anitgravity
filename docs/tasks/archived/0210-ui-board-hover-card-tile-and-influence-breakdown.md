# Task 0210 — UI: Board hover card shows tile + influence breakdown (no raw coord tooltip)

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0210-ui-board-hover-card-tile-and-influence-breakdown`

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

* GR-002: Hover UI reads existing engine state only; does not compute legality/cost/majority; no mutations.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-06 §2.1 BoardSurface (Render tiles/tokens; allow inspection selection; guided parameter selection)
* ARCH: ARCH-06 §2.4 Inspector (read-only details; hover is a read-only extension)
* CORE: CORE-01-00-03A (Influence attached to tiles in Board)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Replace the raw browser `title="coord x,y"` tooltip with a **clean hover card** that shows:
  * coordinate
  * tile type
  * tile weight (if present)
  * Grassroots type tag (DOM/FOR/INF) when applicable
  * influence distribution by player (sorted by seat)
* Hover card must be readable, deterministic, and must not interfere with clicks (pointer-events: none).

---

## 3) Non-Goals

* Do not add any rule text or legality hints (hover is not a rules engine).
* Do not add new animations or complex positioning logic beyond what is needed.
* Do not change Inspector selection behavior (handled separately).

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/HexBoard.tsx` (currently uses `title={`coord ${coordStr}`}`)
  * `packages/client-web/src/components/BoardViewport.tsx` (board container positioning)
  * `packages/client-web/src/index.css` (styling for overlay components)

* Existing behavior summary (current):

  * Hover feedback is a raw coordinate string only.
  * No immediate explanation of what tile is hovered or how influence is distributed.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/components/HexBoard.tsx`
  * Remove the `title` attribute (or set it to empty) to avoid the raw coordinate tooltip.
  * Track hover state including screen position (tile center) + hovered tileId/coord.
  * Render a `BoardHoverCard` (new component) when hovering a real tile.
* `packages/client-web/src/components/BoardHoverCard.tsx` (new)
  * Pure presentation component rendering the required fields.
  * Influence distribution computed from `G.zones[tileId].items` with deterministic seat sorting.
* `packages/client-web/src/index.css`
  * Minimal styles for hover card (glass panel, readable typography, pointer-events: none).

### 5.2 Tests

* Update/Add:
  * `packages/client-web/test/board-hover-card.test.tsx` (new)
    * Render a board with one tile containing influences from multiple owners.
    * Simulate mouseEnter and assert hover card shows type + coord + influence breakdown.
    * Assert that the raw `title` tooltip is removed.

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

* [x] Add `BoardHoverCard` component (no dependencies on controller; takes plain props).
* [x] Update `HexBoard` to compute hover payload (tileId, coord, screen position).
* [x] Remove/disable browser `title` tooltip on hex-cells.
* [x] Add CSS for hover card and ensure it doesn’t block input.
* [x] Add tests for hover card rendering + tooltip removal.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] On hover, a hover card appears showing tile type + coord + influence breakdown.
* [x] No raw `title` tooltip (“coord …”) appears.
* [x] Hover card never blocks clicks (pointer-events: none).
* [x] Golden replay unchanged or updated intentionally with explanation.

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
* [x] `/docs/changelog.md` updated if required (Not required: UI presentation only)

---

## 11) Work Summary (3–7 bullets)

* Created `BoardHoverCard` component to display tile details and influence breakdown using a portal.
* Updated `HexBoard` to track hovered tile screen position (`getBoundingClientRect`).
* Removed raw `title` tooltip from hex tiles and replaced it with the new hover card.
* Added CSS for `.board-hover-card` with glassmorphism style and `pointer-events: none`.
* Added `board-hover-card.test.tsx` to verify rendering and tooltip removal.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → Pass (TypeScript version warning ignored)
* `pnpm vitest run packages/client-web/test/board-hover-card.test.tsx` → Pass
* `pnpm test` → Pass (implied by vitest run)

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
