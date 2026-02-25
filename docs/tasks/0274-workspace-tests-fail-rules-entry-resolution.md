# Task 0274 — Workspace tests fail due to rules package entry resolution

**Date:** 2026-02-25
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0274-workspace-tests-fail-rules-entry-resolution`

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

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (tooling-only change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 (documentation/process contract), ARCH-01:DETERMINISM (test reliability precondition)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Ensure workspace `pnpm -w test` can resolve `@balance-control/rules` during expansion package test runs.
* Make expansion package test scripts self-sufficient by adding required build preconditions.
* Preserve deterministic test execution order and package boundaries.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No rules logic, state model, or resolver behavior changes.
* No UI behavior changes.
* No refactors unrelated to test entrypoint resolution.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/expansion-01/package.json`
  * `packages/expansion-02/package.json`
  * `packages/expansion-03/package.json`
  * `packages/rules/package.json`
* Existing behavior summary (current):

  * `pnpm -w test` fails in expansion package tests before any assertions due to unresolved `@balance-control/rules` entry file (`dist/index.js` absent).

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* N/A — no client-web UX or UI interaction process scope.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/expansion-01/package.json`
* `packages/expansion-02/package.json`
* `packages/expansion-03/package.json`

### 5.2 Tests

* N/A (existing tests exercised)

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

* [x] Step 1: Add test prebuild hooks in expansion packages so `@balance-control/rules` is built before vitest runs.
* [x] Step 2: Re-run `pnpm -w test` and capture next failure boundary or success.
* [x] Step 3: Update task checklist/work summary/commands with outcomes.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `pnpm -w test` no longer fails at `Failed to resolve entry for package "@balance-control/rules"` in expansion test suites.
* [x] Expansion package tests execute with deterministic settings unchanged.
* [x] No gameplay logic files changed.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `pretest` hooks in all expansion packages to build `@balance-control/rules` before Vitest starts.
* Verified `pnpm -w test` now runs expansion pack suites without `@balance-control/rules` entry-resolution failures.
* Captured next independent root-cause block (`EnginePackRegistry` duplicate registration in `packages/game`) in a dedicated follow-up task file (`0275`).

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -w test` → fail: expansion package tests cannot resolve `@balance-control/rules` package entry (`dist/index.js` absent).
* `pnpm -w test` → partial pass for expansion suites after fix; later fails in `packages/game` with first causal error `EnginePackRegistry: pack "exp01" already registered.`
* `pnpm -C packages/expansion-01 test && pnpm -C packages/expansion-02 test && pnpm -C packages/expansion-03 test` → pass: all expansion pack integrity suites green with new pretest hooks.

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — no UI/prozess scope.

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
