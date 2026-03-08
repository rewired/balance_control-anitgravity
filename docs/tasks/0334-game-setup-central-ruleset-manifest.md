# Task 0334 — game setup central ruleset manifest

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
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
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: `SetupGame` metadata remains JSON-serializable and now reads manifest values from the shared rules export instead of local literals.
* GR-012: Match ruleset metadata derives from the canonical rules package constant and continues to filter expansion entries using enabled packs only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`), DD present (`docs/design-decisions/DD-0334-central-ruleset-manifest-single-source.md`), TDD present (this task file), AGENTS present (`/AGENTS.md`), VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (manifest wiring + tests only; no rule behavior change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM; ARCH-02:STATE_SERIALIZATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Remove duplicated hardcoded ruleset fallback literals from game setup.
* Ensure setup metadata uses the central manifest export as the single source of truth.
* Keep current behavior that `meta.ruleset.expansions` only lists enabled expansions.
* Add regression test coverage that detects local literal drift in setup ruleset metadata.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No gameplay rules changes.
* No expansion toggle semantics changes.
* No replay format changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/setup.ts`
  * `packages/game/test/setup.test.ts`
  * `packages/rules/src/manifest.ts`
* Existing behavior summary (current):

  * Setup used a local literal fallback object mirroring `RULESET_MANIFEST` values.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* N/A — no client-web/UI scope.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/setup.ts`
* `packages/game/test/setup.test.ts`

### 5.2 Tests

* `packages/game/test/setup.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0334-central-ruleset-manifest-single-source.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

Changelog path policy (hard):

* Do not target `CHANGELOG.md` (root or any alternate path/case variant).
* Historical archived task files may reference legacy changelog paths; do not rewrite archive content solely for path wording.

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

* [x] Step 1: Replace setup-local ruleset literal fallback with central manifest usage.
* [x] Step 2: Add setup regression test that proves metadata is sourced from `RULESET_MANIFEST`.
* [x] Step 3: Verify enabled-expansion filtering behavior remains unchanged and run checks.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `packages/game/src/setup.ts` no longer duplicates ruleset manifest literals.
* [x] `SetupGame().meta.ruleset` still includes only enabled expansion versions.
* [x] A test fails if setup no longer uses the shared manifest object values.
* [x] `pnpm lint` and targeted vitest command pass.

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

* Removed the local `RULESET_MANIFEST ?? { ... }` literal fallback from game setup.
* Kept setup ruleset expansion projection logic unchanged so only enabled expansion versions are copied.
* Added a setup test that temporarily overrides `RULESET_MANIFEST` values and asserts `SetupGame` reflects them.
* Added task and ADR documentation for manifest single-source-of-truth hardening.
* Updated changelog with task 0334 entry.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → OK
* `pnpm vitest run packages/game/test/setup.test.ts` → FAIL (workspace package `@balance-control/rules` entry unresolved before build)
* `pnpm --filter @balance-control/rules build` → OK
* `pnpm vitest run packages/game/test/setup.test.ts` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — no client-web/UI scope.

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

### A-01 — N/A

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
