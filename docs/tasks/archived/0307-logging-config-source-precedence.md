# Task 0307 — Logging config source precedence and ENV mapping

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0307-config-source-precedence`

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
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, governance precedence); DD present (DD-0306 baseline and DD-0307 for this refinement); TDD present (this task file); AGENTS present (`/AGENTS.md`); VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (configuration docs only; no gameplay rule changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT (documentation update requirements), ARCH-01:DETERMINISM (deterministic config resolution order)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Define a strict, deterministic source precedence for logging config values.
* Specify the ENV naming/path mapping convention with double underscore as segment separator.
* Document per-source type conversion behavior (CLI, ENV, `conf.json`, defaults).
* Document startup-fatal error behavior for invalid known-field values.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No runtime parser implementation in packages.
* No changes to game rules, move legality, engine state shape, or UI behavior.
* No changes to replay file format support beyond documented v1 constraints.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* `docs/logging-config-v1.md`
* `docs/changelog.md`
* `docs/design-decisions/DD-0306-logging-config-spec-v1.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — docs-only scope; no UI/prozess change.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* N/A

### 5.2 Tests

* N/A

### 5.3 Docs

* [x] `/docs/logging-config-v1.md` updated with source precedence, ENV mapping convention, and conversion/failure policy.
* [x] `/docs/design-decisions/DD-0307-logging-config-source-precedence.md` created.
* [x] `/docs/changelog.md` updated.
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Step 1: Extend logging config v1 docs with canonical source precedence and merge semantics.
* [x] Step 2: Add explicit ENV key mapping convention and concrete examples.
* [x] Step 3: Define per-source conversion and startup failure behaviors.
* [x] Step 4: Add DD + changelog trace and run project checks.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Documentation explicitly states precedence order: CLI > ENV > `conf.json` > defaults.
* [x] Documentation defines double-underscore ENV path convention with provided examples.
* [x] Documentation defines type conversion and failure behavior per source.
* [x] Invalid known-field boolean/integer values are specified as startup-fatal with clear error messages.

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
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added deterministic source-precedence semantics to the logging config v1 specification.
* Documented the `BC_` + `__` ENV mapping convention and concrete replay examples.
* Added per-source conversion requirements and startup-fatal validation policy for known-field type violations.
* Clarified unknown-key handling across CLI/ENV/`conf.json` remains forward-compatible and informational.
* Added ADR traceability (DD-0307) and recorded the change in the canonical changelog.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → ok
* `pnpm test` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → N/A (docs-only scope)
* `pnpm run test:ui:unit` → N/A (docs-only scope)
* `pnpm run test:ui:coverage` → N/A (docs-only scope)
* `pnpm run test:ui:e2e` → N/A (docs-only scope)

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
