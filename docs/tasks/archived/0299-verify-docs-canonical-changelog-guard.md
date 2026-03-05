# Task 0299 — Enforce canonical changelog path in docs verification

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

* CORE: N/A (tooling/documentation enforcement only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Extend `scripts/verify-docs.mjs` to enforce a single allowed changelog location at `docs/changelog.md`.
* Make docs verification fail when additional changelog variants exist (e.g. root `CHANGELOG.md` or case/path variants).
* Wire the guard into the pnpm quality workflow and CI execution path so violations are visible in PRs early.
* Document the housekeeping guardrail in `AGENTS.md`.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to engine game logic, moves, state model, or resolver behavior.
* No rule text/spec anchor registry changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `scripts/verify-docs.mjs`
  * `package.json`
  * `.github/workflows/ci.yml`
  * `AGENTS.md`
  * `CHANGELOG.md` + `docs/changelog.md`
* Existing behavior summary (current):

  * Docs verification did not enforce canonical changelog location; repository still contained root `CHANGELOG.md` compatibility stub.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A (no client-web UX/process scope).

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `scripts/verify-docs.mjs`
* `package.json`
* `.github/workflows/ci.yml`
* `AGENTS.md`
* `docs/tasks/0299-verify-docs-canonical-changelog-guard.md`
* `docs/changelog.md`

### 5.2 Tests

* N/A (uses existing verification/test commands; no new test files)

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

* [x] Step 1: Add canonical changelog location check in `scripts/verify-docs.mjs` that fails on any non-`docs/changelog.md` changelog filename variant.
* [x] Step 2: Remove root `CHANGELOG.md` so repository complies with the new guard.
* [x] Step 3: Hook guard into quality workflow by adding `verify:docs` to the `pnpm test` pipeline and keeping CI docs verification explicit and early.
* [x] Step 4: Document the guardrail in `AGENTS.md` and record task/changelog updates.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `pnpm run verify:docs` fails if any changelog file exists outside `docs/changelog.md`.
* [x] Repository contains exactly one changelog file path: `docs/changelog.md`.
* [x] `pnpm test` and CI route execute docs verification with the canonical changelog check.
* [x] Guardrail statement exists in `AGENTS.md` under documentation/housekeeping section.
* [x] Golden replay unchanged or updated intentionally with explanation (N/A: tooling/docs-only task).

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
* [x] Determinism verified (golden replay/state hash) (N/A: tooling/docs-only task)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added a new canonical changelog guard in `scripts/verify-docs.mjs` that scans repository files and fails on any `changelog.md` filename outside `docs/changelog.md`.
* Kept the existing docs verification flow and inserted the new guard into the default `pnpm test` workflow so local/CI quality runs catch violations early.
* Adjusted CI step ordering to run docs verification immediately after dependency installation.
* Removed the root-level `CHANGELOG.md` compatibility file to satisfy the new single-path policy.
* Added a concise housekeeping guardrail to `AGENTS.md` documenting the allowed changelog location.
* Added a changelog entry for task 0299 and recorded this task artifact.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm run verify:docs` → PASS.
* `pnpm lint` → PASS.
* `pnpm test` → PASS.

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

N/A (no UI/prozess scope).

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
