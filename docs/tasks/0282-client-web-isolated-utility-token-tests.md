# Task 0282 — Client-web isolated utility and token tests

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0282-client-web-isolated-utility-token-tests`

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

* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-014: Changes are isolated client-web test coverage for existing presentation behavior (`Token` CSS-class/title mapping) and do not alter iconography/runtime mappings.
* GR-014: No production UI logic changes; assertions validate existing stable presentation semantics only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (test-only; no rules behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add isolated unit tests for lobby session localStorage helpers, including defensive error handling branches.
* Add unit tests for `getObjectLabel` fallback behavior when objects or required labels are missing.
* Add focused DOM-assertion tests for `Token` class name/title behavior for Influence, MetaMarker, and Resource resort mapping normalization.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No runtime code behavior changes in `session.ts`, label helpers, or token component.
* No engine/state/resolver/production changes.
* No snapshot testing expansion beyond targeted DOM assertions.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/lobby/session.ts`
  * `packages/client-web/src/ui/interaction/labelHelpers.ts`
  * `packages/client-web/src/components/Token.tsx`
* Existing behavior summary (current):

  * Session helpers swallow storage/JSON errors and return null/no-op.
  * `getObjectLabel` falls back to object ID when object or specific display fields are absent.
  * `Token` normalizes resource resorts and maps known resorts to `resource-*` classes, else `resource-unknown`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* Bound to runbook: YES

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/test/lobby-session-utils.test.ts`
* `packages/client-web/src/ui/__tests__/labelHelpers.test.ts`
* `packages/client-web/test/token.test.tsx`

### 5.2 Tests

* `packages/client-web/test/lobby-session-utils.test.ts`
* `packages/client-web/src/ui/__tests__/labelHelpers.test.ts`
* `packages/client-web/test/token.test.tsx`

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

* [x] Step 1: Add `lobby-session-utils` unit tests for invalid JSON/shape and localStorage read/write/remove throw branches.
* [x] Step 2: Add `labelHelpers` unit tests for unknown object ID and missing Resource/Measure label fields.
* [x] Step 3: Add dedicated `Token` DOM tests for Influence, MetaMarker, and Resource known/unknown/normalized resorts.
* [x] Step 4: Execute frontend QA unit/coverage command order and targeted suite checks.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `readLastSession()` returns `null` for malformed JSON and malformed shapes.
* [x] Session helper catch branches for localStorage `getItem`, `setItem`, and `removeItem` are exercised without thrown test failures.
* [x] `getObjectLabel` returns `objectId` for unknown objects and missing Resource/Measure label fields.
* [x] `Token` tests assert className/title for Influence, MetaMarker, and Resource known/unknown/normalized resorts without snapshot reliance.

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
* [x] Determinism verified (golden replay/state hash) — N/A (client-web test-only scope)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `lobby-session-utils` unit tests covering malformed persisted data and defensive `localStorage` try/catch code paths.
* Added `labelHelpers` unit tests validating object-label fallback for unknown IDs and missing `resort` / `measureId` fields.
* Added dedicated `token.test.tsx` with direct DOM assertions for `className` and `title` on Influence, MetaMarker, and Resource variants.
* Included resource resort normalization assertion (`'  sEc  '` → `resource-sec`) plus unknown resort fallback assertion.
* Updated task artifact with guardrail mapping, checklist completion, and executed command log.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS.
* `pnpm run test:ui:coverage` → PASS.
* `pnpm -C packages/client-web exec vitest run test/lobby-session-utils.test.ts src/ui/__tests__/labelHelpers.test.ts test/token.test.tsx` → PASS.

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS
* `pnpm run test:ui:unit` → PASS
* `pnpm run test:ui:coverage` → PASS
* `pnpm run test:ui:e2e` → N/A (task scope is isolated unit tests only; no UX/runtime behavior changes)

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

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only after FROZEN)

* N/A
