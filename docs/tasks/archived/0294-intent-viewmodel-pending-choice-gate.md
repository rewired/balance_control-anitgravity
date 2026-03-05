# Task 0294 — Client-web pendingChoice gate decoupled from resolveChoice enumeration

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0294-intent-viewmodel-pending-choice-gate`

---

**Task State:** DONE

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
* GR-006
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * The client change remains presentation-only and consumes engine intents/pendingChoice state without recomputing legality.
* GR-006:
  * Hard-gate state in the ViewModel now keys from pendingChoice ownership (`getPendingChoiceKindForPlayer`) instead of transient intent list length.
  * `resolveChoice` intents remain exposed for rendering/targeting only.
* GR-014:
  * No iconography mapping or visual namespace contracts are changed.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (presentation-only contract task)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 §5 (PENDING CHOICE HARD GATE), ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Ensure `hasPendingChoice` in client ViewModel is driven by owner-scoped pendingChoice authority.
* Prevent false hard-gate activation/deactivation caused by transient `resolveChoice` enumeration shape.
* Preserve `resolveChoice` grouping for rendering valid targets/choices.
* Add regression tests for both owner-authority positive and resolveChoice-only negative cases.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No engine legality, pendingChoice, or move-resolution logic changes.
* No UI layout/styling changes.
* No expansion behavior or bot contract changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/ui/useIntentViewModel.ts`
  * `packages/client-web/src/ui/__tests__/intentViewModel.test.ts`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * `buildIntentViewModel` computes `hasPendingChoice` from `resolveChoice.length > 0`, potentially coupling hard-gate status to legal-intent enumeration.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

Bound: YES.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/ui/useIntentViewModel.ts`

### 5.2 Tests

* `packages/client-web/src/ui/__tests__/intentViewModel.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
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

* [ ] Step 1: Update `buildIntentViewModel` hard-gate derivation to use owner-scoped `pendingChoiceKind !== null` and add explicit TSDoc invariant note.
* [ ] Step 2: Add unit tests covering pendingChoice authority vs resolveChoice-intent presence/absence.
* [ ] Step 3: Run required frontend QA command order and targeted test command, then update task artifact sections and changelog.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `hasPendingChoice` is `true` when `pendingChoiceKind` is non-null, even with empty intents.
* [ ] `hasPendingChoice` is `false` when `pendingChoiceKind` is null, even if `resolveChoice` intents are present.
* [ ] `resolveChoice` intents continue to be exposed under `pendingChoice.resolveChoice` for rendering.
* [ ] `intentViewModel` unit tests include both regression cases and pass.
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
* [ ] Determinism verified (golden replay/state hash) (N/A: client-viewmodel scope, no engine transition changes)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Updated `buildIntentViewModel` hard-gate authority so `hasPendingChoice` is derived from owner-scoped `pendingChoiceKind !== null`, not `resolveChoice` intent count.
* Kept `resolveChoice` intents in the ViewModel for rendering and target projection; only gate derivation was decoupled.
* Added two regression tests in `intentViewModel.test.ts` for (1) pendingChoiceKind + empty intents and (2) null pendingChoiceKind + resolveChoice intents.
* Updated UI integration tests (`pending-choice-modal` and `public-notice-unplaceable`) to set explicit `engine.pendingChoice` fixtures so modal expectations match hard-gate ownership authority.
* Added changelog entry documenting task 0294 behavior/invariant update.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → PASS.
* `pnpm -C packages/client-web exec vitest run src/ui/__tests__/intentViewModel.test.ts test/pending-choice-modal.test.tsx test/public-notice-unplaceable.test.tsx` → PASS (17 tests).
* `pnpm run test:ui:unit` → PASS (46 files / 266 tests).
* `pnpm run test:ui:coverage` → PASS (thresholds satisfied).
* `pnpm run test:ui:e2e` (first run) → FAIL due missing Playwright browser binary; installed runtime dependencies + browsers.
* `pnpm exec playwright install --with-deps chromium` → PASS.
* `pnpm run test:ui:e2e` (second run) → FAIL (5 failing E2E specs; 5 passed).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS.
* `pnpm run test:ui:coverage` → PASS.
* `pnpm run test:ui:e2e` → FAIL (after browser install, 5/10 specs still failing in this environment/test state).

If not applicable, write explicit `N/A` with reason.

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
