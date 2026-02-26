# Task 0298 — Canonicalize changelog path to `docs/changelog.md`

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `work`

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

* NONE

### compliance_notes (required if affected_guardrails != NONE)

N/A.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (documentation path canonicalization only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT (canonical documentation maintenance)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Make `docs/changelog.md` the only canonical changelog source.
* Ensure legacy root `CHANGELOG.md` no longer duplicates content and instead points to canonical docs path.
* Verify that no non-archived files still reference `CHANGELOG.md` as canonical path.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No engine/client/runtime behavior changes.
* No historical content rewrites beyond changelog-path canonicalization.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `CHANGELOG.md`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * Both root and docs changelog files existed in parallel, creating duplicate source ambiguity.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A (docs-only task; no client-web UX/process coverage changes).

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `CHANGELOG.md`
* `docs/changelog.md`
* `docs/tasks/0298-changelog-canonicalization.md`

### 5.2 Tests

* N/A (docs-only task)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
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

* [x] Step 1: Compare `CHANGELOG.md` and `docs/changelog.md` and ensure relevant history remains represented in docs canonical file.
* [x] Step 2: Replace root `CHANGELOG.md` with a short compatibility stub pointing to `docs/changelog.md`.
* [x] Step 3: Search non-archived files for `CHANGELOG.md` references and update if present.
* [x] Step 4: Record task artifact and changelog entry.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `docs/changelog.md` is clearly maintained as canonical changelog.
* [x] Root `CHANGELOG.md` is no longer a duplicate source and points to docs path.
* [x] No non-archived repository references still direct contributors to root `CHANGELOG.md` as canonical source.
* [x] Golden replay unchanged or updated intentionally with explanation (N/A: docs-only task).

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (N/A: docs-only path canonicalization)
* [ ] `pnpm test` (or `pnpm vitest run`) passes (N/A: docs-only path canonicalization)
* [ ] Determinism verified (golden replay/state hash) (N/A: docs-only task)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Verified that changelog history is maintained in `docs/changelog.md` and treated it as canonical source.
* Added a new `task(0298)` entry in `docs/changelog.md` documenting changelog canonicalization.
* Replaced root `CHANGELOG.md` with a minimal compatibility stub that points to `docs/changelog.md`.
* Searched non-archived files for `CHANGELOG.md` references and confirmed there were no remaining canonical-path mentions to update.
* Added this task artifact with guardrails/acceptance/proof sections completed.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `rg --files | rg 'AGENTS.md|ARCH-00-MASTERPLAN-GUARDRAILS.json|docs/tasks|CHANGELOG.md|docs/changelog.md'` → PASS.
* `cat docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` → PASS.
* `diff -u CHANGELOG.md docs/changelog.md` → PASS (comparison only; docs file already held full chronological changelog).
* `rg -n "CHANGELOG\\.md" --glob '!docs/tasks/archived/**'` → PASS (no remaining references).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

N/A (docs-only task; no UI/prozess scope).

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
