# Task 0302 — Housekeeping-Checks für kanonische Doc-Pfade

**Date:** 2026-02-26
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

* CORE: N/A (tooling/docs housekeeping)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 documentation contract; governance precedence `SEC > DD > TDD > AGENTS > VISION`.

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a dedicated `pnpm run check:housekeeping` command.
* Enforce a whitelist-based guard for root markdown docs.
* Enforce canonical `docs/changelog.md` path checks.
* Reject newly added task docs that still use legacy changelog paths.
* Document purpose and limits of housekeeping automation under `docs/qa/`.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No engine/gameplay logic changes.
* No retrospective rewrites of archived historical task docs.
* No replacement of existing `verify:docs` checks; only complementing them.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* `package.json`
* `scripts/verify-docs.mjs`
* `docs/changelog.md`
* `docs/tasks/` (non-archived task docs)

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* N/A — no UI change.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `scripts/check-housekeeping.mjs`
* `package.json`

### 5.2 Tests

* N/A (static check script execution as verification)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)
* `docs/qa/housekeeping-checks.md` added

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

* [x] Step 1: Implement `scripts/check-housekeeping.mjs` with static checks for root markdown whitelist and canonical changelog path.
* [x] Step 2: Add task-file legacy changelog-path guard scoped to newly added tasks.
* [x] Step 3: Wire command as `pnpm run check:housekeeping` and include it in `pnpm test`.
* [x] Step 4: Document scope and explicit non-goals/limits in `docs/qa/housekeeping-checks.md`.
* [x] Step 5: Update `docs/changelog.md`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `pnpm run check:housekeeping` exists and runs in CI/local.
* [x] Root markdown whitelist rejects non-whitelisted root markdown files.
* [x] Canonical changelog guard enforces `docs/changelog.md`.
* [x] New task docs are rejected when using legacy `CHANGELOG.md` path variants.
* [x] Documentation explains what is and is not checked automatically.

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added a new housekeeping checker script (`scripts/check-housekeeping.mjs`) for static doc-path hygiene.
* Enforced root markdown whitelist (`README.md`, `AGENTS.md`) to prevent root-level duplicate canonical docs.
* Added canonical changelog path checks to assert `docs/changelog.md` exists and root `CHANGELOG.md` is absent.
* Added task guard that rejects legacy changelog path usage in newly added task files (policy floor and git-added detection).
* Wired the new checker as `pnpm run check:housekeeping` and into the `pnpm test` pipeline.
* Documented purpose and explicit limitations in `docs/qa/housekeeping-checks.md`.
* Added changelog entry for task 0302.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm run check:housekeeping` → ok
* `pnpm lint` → ok
* `pnpm test` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — no UI scope.

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

* N/A
