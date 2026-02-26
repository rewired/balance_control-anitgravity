# Task 0255 — Frontend QA Runbook Standard

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Changes are documentation/process only and do not add any client-side rule execution path.
  * QA mapping explicitly reinforces engine-owned legality and commit-path boundaries from ARCH-06.
* GR-014:
  * Adds QA artifact policy (including screenshot requirements) without changing icon mapping or visual namespace behavior.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (no gameplay/rule behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT, ARCH-06 §1-§7, ARCH-06 Checklist §1-§10

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a concise frontend QA runbook under `docs/testing/`.
* Define mandatory command order (lint, unit, coverage, e2e) with pass/fail criteria.
* Map QA steps to ARCH-06 checklist sections.
* Define required PR artifacts including logs and screenshots for UI-visible changes.
* Wire references into the non-negotiable task template.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No runtime code changes in `packages/*`.
* No modifications to gameplay/rules/spec anchors.
* No CI workflow script changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`
  * `docs/changelog.md`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
* Existing behavior summary (current):

  * No dedicated `docs/testing/frontend-qa.md` runbook exists yet.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* N/A

### 5.2 Tests

* N/A

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Add `docs/testing/frontend-qa.md` with mandatory command order + pass/fail criteria.
* [x] Step 2: Add ARCH-06 checklist mapping and required PR artifacts.
* [x] Step 3: Add template references in `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`.
* [x] Step 4: Update changelog and add DD record.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] New runbook exists under `docs/testing/frontend-qa.md`.
* [x] Runbook includes command order, pass/fail criteria, ARCH-06 mapping, and PR artifact requirements.
* [x] Task template references the runbook and command order section.
* [x] Changelog entry added for task 0255.
* [x] DD/ADR record added for process-level decision.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Added `docs/testing/frontend-qa.md` as canonical frontend QA runbook.
* Documented mandatory lint/unit/coverage/e2e order and gate semantics.
* Added ARCH-06 checklist mapping per QA step.
* Documented required PR artifacts, including screenshot policy for UI-visible changes.
* Updated the non-negotiable task template with explicit runbook references.
* Added DD-0255 for the process decision and updated changelog.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → ✅ PASS.
* `pnpm test` → ❌ FAIL (pre-existing workspace failure in `packages/expansion-01` and `packages/expansion-02`: `@balance-control/rules` entrypoint resolution during Vitest).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → ✅ PASS.
* `pnpm run test:ui:unit` → ✅ PASS.
* `pnpm run test:ui:coverage` → ❌ FAIL (coverage provider module not resolved under workspace `vitest@0.30.1`; pre-existing tooling mismatch).
* `pnpm exec playwright install chromium` → ✅ PASS.
* `pnpm run test:ui:e2e` → ⚠️ FAIL in this container (missing Linux shared library `libatk-1.0.so.0` for Playwright Chromium runtime).

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

### A-01 — N/A

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
