# Task 0301 — Governance document precedence hardening

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0301-document-precedence-governance`

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
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (docs/tooling governance)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 documentation contract; AGENTS execution protocol sections 0, 2, 4.

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a concise normative governance document that fixes precedence as `SEC > DD > TDD > AGENTS > VISION`.
* Link this governance source from AGENTS and the non-negotiable task template.
* Add verifier support so new task artifacts must reference this precedence rule in guardrails/assumptions context.
* Preserve docs-first traceability with changelog + DD (ADR) updates.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No game-engine, client, bot, or rules behavior changes.
* No rule-anchor regeneration or gameplay test fixture updates.
* No archived task rewrites.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `AGENTS.md`
  * `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`
  * `scripts/verify-task.mjs`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * No central governance doc fixed the requested precedence order.
  * Task template had no explicit assumptions-precedence checklist.
  * verify-task did not enforce precedence reference.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* N/A — docs/tooling governance only.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `AGENTS.md`
* `docs/governance/document-precedence.md`
* `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`
* `scripts/verify-task.mjs`

### 5.2 Tests

* N/A (tool verification + workspace tests run)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Add governance precedence document with conflict-resolution section.
* [x] Step 2: Add links in AGENTS + task template and add assumptions precedence checklist.
* [x] Step 3: Extend verify-task check for precedence reference in section 0.
* [x] Step 4: Update changelog and add DD-0301 ADR trace.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `docs/governance/document-precedence.md` exists and contains exact order `SEC > DD > TDD > AGENTS > VISION`.
* [x] `AGENTS.md` and `_TASK_TEMPLATE_NONNEGOTIABLE.md` link the governance doc.
* [x] `scripts/verify-task.mjs` fails if section `0) Masterplan Guardrails` lacks precedence reference.
* [x] Changelog + DD updates are present.
* [x] Golden replay unchanged or updated intentionally with explanation. (Unchanged; docs/tooling-only)

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

* Added `docs/governance/document-precedence.md` with the fixed normative ordering `SEC > DD > TDD > AGENTS > VISION`.
* Added AGENTS link so precedence is always visible in primary contract navigation.
* Updated `_TASK_TEMPLATE_NONNEGOTIABLE.md` with governance link + explicit `assumptions_precedence` checklist.
* Extended `scripts/verify-task.mjs` to require precedence reference in section `0) Masterplan Guardrails`.
* Added DD-0301 as ADR trace and updated `docs/changelog.md`.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → ok
* `pnpm test` → ok
* `node scripts/verify-task.mjs 0301` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — docs/tooling governance only.

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

* `YYYY-MM-DD HH:MM — <what changed> — <reason> — <approved by>`

