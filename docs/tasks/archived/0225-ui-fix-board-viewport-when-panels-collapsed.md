# Task 0225 — Fix board viewport layout when panels are collapsed

**Date:** 2026-02-23
**Owner:** Codex CLI
**Branch:** `task/0225-e2e-board-viewport`

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

* GR-002: Changes are presentation-only (CSS layout + client configuration) and do not compute legality/costs/majority/modifiers on the client.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Board viewport remains visible and usable when left/right panels are collapsed.
* E2E test `e2e/client-web/board-viewport.spec.ts` passes in CI/headless.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to engine rules, legality, costs, production, or state.
* No redesign of panel UX; only layout correctness and test stability.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/GameLayout.tsx`
  * `packages/client-web/src/index.css`
  * `packages/client-web/src/App.tsx`
  * `packages/client-web/src/hotseat/HotseatShell.tsx`
  * `e2e/client-web/board-viewport.spec.ts`
* Existing behavior summary (current):

  * When the side panels are hidden via `display: none`, CSS grid auto-placement can place the center panel into the 0px left column, collapsing the board viewport and failing `toBeVisible()` in Playwright.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/index.css`
* `packages/client-web/src/App.tsx`
* `packages/client-web/src/hotseat/HotseatShell.tsx`

### 5.2 Tests

* N/A (existing e2e must pass; no test code changes planned)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — N/A
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

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

* [ ] Fix CSS grid placement so `.center-panel` always occupies the middle column even when asides are `display: none`.
* [ ] Ensure `.controls-container` is pinned to the second grid row to avoid auto-placement into collapsed columns.
* [ ] Disable boardgame.io debug panel in client instances to prevent overlay/pointer interception in e2e.
* [ ] Run `pnpm -w e2e` and `pnpm test`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `pnpm -w e2e` passes (including `board viewport: load + fit/zoom/pan/reset`).
* [ ] Board viewport is visible in online mode with panels collapsed.
* [ ] No client-side rule computation is added (GR-002).

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

* Pin grid placement for `.left-panel`, `.center-panel`, `.right-panel`, and `.controls-container` to prevent CSS grid auto-placement from collapsing the board when panels are hidden.
* Disable boardgame.io debug panel via `debug: false` in client instances to avoid overlay interference in e2e.
* Wrap HUD tile icon rendering in `<svg>` so SVG `<image>` is rendered in the correct namespace (prevents React console warnings that fail e2e).

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -w e2e` → ok (6 passed)
* `pnpm lint` → ok
* `pnpm test` → ok

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

N/A
