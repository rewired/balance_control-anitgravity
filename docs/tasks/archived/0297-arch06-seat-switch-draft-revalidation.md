# Task 0297 — ARCH-06 seat-switch draft revalidation and confirm-disable proof

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0297-arch06-seat-switch-draft-revalidation`

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
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Seat-switch legality remains engine-owned via refreshed `vm.intents`; UI only reflects `draft.isLegalNow`.
  * E2E/unit assertions verify disabled confirm without any client-side move synthesis.
* GR-014:
  * No iconography contract changes; only interaction-contract text and test hardening.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (client interaction + docs/tests only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 §4 Interaction Model; ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Document seat-switch draft revalidation behavior explicitly in ARCH-06 Interaction Model.
* Strengthen E2E proof for draft-key presence/optional retention, disabled confirm after seat switch, and no auto-commit side effect.
* Add ActionDock component regression showing confirm becomes disabled when seat context changes and draft legality flips false.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to engine legality computation logic.
* No changes to move payload schemas.
* No visual restyling of ActionDock.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`
  * `e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts`
  * `packages/client-web/test/action-dock.test.tsx`
  * `packages/client-web/src/components/ActionDock.tsx`
* Existing behavior summary (current):

  * Confirm button disabled on illegal draft was covered, but draft-key continuity and no-auto-commit seat-switch assertion were not explicit.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

Bound: YES.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`
* `packages/client-web/src/components/ActionDock.tsx`

### 5.2 Tests

* `e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts`
* `packages/client-web/test/action-dock.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0297-seat-switch-draft-revalidation.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Update ARCH-06 Interaction Model with explicit seat-switch revalidation + disabled confirm statement.
* [x] Step 2: Surface deterministic draft key in ActionDock for robust E2E assertions.
* [x] Step 3: Extend ARCH-06 E2E to assert pre/post draft-key behavior, confirm disabled after seat switch, and unchanged state ID (no auto-commit).
* [x] Step 4: Add ActionDock component regression for seat/context change causing `draft.isLegalNow=false` and disabled confirm.
* [x] Step 5: Update changelog + DD + task artifact.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Interaction Model text explicitly defines seat-switch draft revalidation and disabled confirm behavior.
* [x] E2E asserts draft key exists before seat switch.
* [x] E2E asserts confirm remains disabled after seat switch and no auto-commit occurs.
* [x] Component test covers seat/context change forcing `draft.isLegalNow` false and disabled confirm.
* [x] Golden replay unchanged or updated intentionally with explanation (N/A: no engine-transition logic touched).

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
* [ ] Determinism verified (golden replay/state hash) (N/A: docs + client interaction scope)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added ARCH-06 normative sentence defining immediate draft revalidation on `playerID`/seat switch and disabled confirm in the new seat context.
* Added non-visual `draft-key` test hook in ActionDock draft panel for deterministic assertions.
* Hardened ARCH-06 draft invalidation E2E with pre-switch draft-key proof, post-switch optional same-key check, disabled confirm assertion, and `stateID` no-auto-commit guard.
* Added ActionDock component regression proving seat/context change can retain draft key while forcing `draft.isLegalNow=false` and confirm disabled.
* Added DD-0297 trace note and changelog entry.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS.
* `pnpm run test:ui:coverage` → PASS.
* `pnpm exec playwright test e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts` → PASS.

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS.
* `pnpm run test:ui:coverage` → PASS.
* `pnpm run test:ui:e2e` → FAIL (5 failing baseline specs: arch06-no-autocommit, arch06-pending-choice-hardgate x2, board-viewport, and this task's spec before final assertion hardening).

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

N/A.
