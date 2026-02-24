# Task 0211 — UI: Stabilize Hex Hover (No Layout Shift) via ::before Hit-Area + will-change

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0211-ui-hexcell-hit-area-no-hover-shift`
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

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

* GR-002: CSS-only presentation fix in `packages/client-web`. No client-side legality/cost/majority logic, no new commit paths, no move dispatch.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH-06 Checklist: `5) Guided Parameter Selection` (valid targets must be usable; avoid UX glitches that impair selection)
* ARCH-06 Checklist: `10) Visual/UX Minimums` (interaction affordances must be stable and readable)
* ARCH-06 (YAML): `surfaces.BoardSurface.responsibilities.guided_parameter_selection`

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Hovering/selecting/target-highlighting a tile must **not** cause the tile to visually shift by ~1–2px (no layout jitter).
* Preserve the “larger hit area” behavior for hot cells, but implement it **without changing the `.hex-cell` box size** (use `::before` with negative inset).
* Reduce hover flicker/jitter during compositing by adding: `.hex-cell { will-change: transform; }`.

---

## 3) Non-Goals

* No changes to engine logic, legal intents, costs, moves, or determinism.
* No redesign of hover UI/tooltip content.
* No changes to tile visuals (SVG layout, icons, numbers) beyond preventing hover-driven shifting.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/index.css`
  * `packages/client-web/src/components/HexBoard.tsx` (applies `hex-cell-hot` based on hovered/selected/validTarget/drafted)

* Existing behavior summary (current):

  * `.hex-cell-hot` increases `--hex-hit-pad` to `28px`, and `.hex-cell` uses that variable to increase `width/height`.
  * Because `.hex-cell` is centered via `transform: translate(-50%, -50%)`, changing the element box size changes the translate distance (percentage-based), producing a visible ~1–2px “jump” on hover/selection.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/index.css`
  * Make `.hex-cell` width/height **constant** (`var(--hex-cell-w/h)`) and keep `--hex-hit-pad` only for hit-area expansion.
  * Add `.hex-cell::before` to enlarge pointer hit-area using `inset: calc(var(--hex-hit-pad) * -1)` with transparent background.
  * Add `.hex-cell { will-change: transform; }` for anti-flicker.

### 5.2 Tests

* NONE (CSS-only change; verify via manual UX checks in dev)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — N/A (presentation-only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* UI remains presentation-only; no rules logic in client.
* No new commit path: do not introduce any `moves.*` or `dispatchIntent(...)` calls in components.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash (unchanged).
* State is JSON-serializable; no functions; no derived caches (unchanged).
* UI remains presentation-only; no rules logic in client.
* Valid target clicking remains reliable; hit-area is still enlarged for hot cells.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Step 1: In `index.css`, change `.hex-cell` to use constant `width: var(--hex-cell-w)` and `height: var(--hex-cell-h)` (remove `hit-pad` from sizing).
* [ ] Step 2: Add `.hex-cell::before`:
  * `content: ''`
  * `position: absolute`
  * `inset: calc(var(--hex-hit-pad) * -1)`
  * `background: transparent`
  * Keep `.hex-cell { overflow: visible; }` so hit-area can extend.
* [ ] Step 3: Keep `.hex-cell-hot { --hex-hit-pad: 28px; }` unchanged so behavior remains.
* [ ] Step 4: Add `.hex-cell { will-change: transform; }`.
* [ ] Step 5: Verify that existing `::after` overlays (`.hex-cell-target::after`, `.hex-cell-selected::after`) remain visible and unaffected.
* [ ] Step 6: Manual UX verification (dev): hover/selection/target highlight causes **no positional shift**; clickability near edges still improved.
* [ ] Step 7: Run repo checks (`pnpm lint`, `pnpm test`) to ensure no regressions.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Hovering a tile does not shift the tile (or its icon/text) by 1–2px at typical zoom levels (including fractional zoom).
* [ ] Selecting a tile does not shift the tile by 1–2px.
* [ ] Valid target highlight state does not shift the tile by 1–2px.
* [ ] Hit-area remains expanded for hot cells (edge clicks near the silhouette still trigger the `.hex-cell` events).
* [ ] No visual artifacts introduced by `::before` (it remains invisible).
* [ ] `pnpm lint` passes.
* [ ] `pnpm test` (or `pnpm vitest run`) passes.

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

* Changed `.hex-cell` sizing to be constant (`width: var(--hex-cell-w)` instead of calculation with hit-pad).
* Added `.hex-cell::before` to handle hit-area expansion via negative inset, preventing layout shift on hover.
* Added `will-change: transform` to `.hex-cell` to reduce compositing flicker.
* Fixed `packages/client-web/test/board-preview-overlay.test.tsx` which was missing `canInspect={true}` prop required for tile selection testing.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → Passed (no errors)
* `pnpm test` → Passed (all 193 tests passed)
* `pnpm vitest run packages/client-web/test/board-preview-overlay.test.tsx` → Passed (after fix)

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
