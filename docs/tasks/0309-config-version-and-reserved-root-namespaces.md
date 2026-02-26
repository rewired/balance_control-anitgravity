# Task 0309 — Config version root field and reserved top-level namespaces

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0309-config-version-root`

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
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, governance precedence); DD present (DD-0309); TDD present (this task file); AGENTS present (`/AGENTS.md`); VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (configuration/documentation scope only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT (documentation updates and compatibility contract clarity)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a root `configVersion` field to the logging configuration v1 document with canonical value `"1"`.
* Define deterministic migration behavior for missing version (legacy v0 upgrade path).
* Define fail-fast behavior for unknown higher versions with explicit supported-version hints.
* Reserve top-level namespaces (`server`, `client`, `matchmaking`, `bot`, `logging`) for non-breaking future extension.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No runtime parser/loader code changes in `packages/*`.
* No gameplay rules/state/engine behavior changes.
* No UI interaction changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* `docs/logging-config-v1.md`
* `docs/changelog.md`
* Existing logging ADR sequence (`DD-0306`, `DD-0307`, `DD-0308`)

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — no UI/client behavior touched.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* N/A (documentation-only scope)

### 5.2 Tests

* N/A (documentation-only scope)

### 5.3 Docs

* [x] `/docs/logging-config-v1.md` updated with root versioning, migration behavior, and reserved top-level namespaces.
* [x] `/docs/design-decisions/DD-0309-config-version-and-reserved-root-namespaces.md` created.
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

* [x] Step 1: Update logging config v1 document to add root `configVersion` and top-level namespace reservations.
* [x] Step 2: Add deterministic migration gate rules for missing/unknown versions while preserving `logging.replay` compatibility.
* [x] Step 3: Add ADR and changelog entries for traceability.
* [x] Step 4: Run lint and tests to verify repository integrity.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `docs/logging-config-v1.md` defines root `configVersion` with canonical v1 value `"1"`.
* [x] Missing `configVersion` is documented as legacy v0 with deterministic upgrade path to v1.
* [x] Unknown higher `configVersion` behavior is documented as fail-fast with supported-version hints.
* [x] Top-level reserved namespaces `server`/`client`/`matchmaking`/`bot`/`logging` are documented.
* [x] ADR and changelog are updated.

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

* Added root `configVersion` contract to `docs/logging-config-v1.md` with canonical value `"1"`.
* Added deterministic version gate policy: missing version means legacy v0 migration; unsupported higher versions fail fast.
* Reserved top-level namespaces (`server`, `client`, `matchmaking`, `bot`, `logging`) for forward-compatible growth.
* Clarified that `logging.replay` remains compatible while the root envelope evolves.
* Added ADR DD-0309 for architectural traceability.
* Updated `docs/changelog.md` with task(0309) entry.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → ok
* `pnpm test` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → N/A (no UI/prozess scope)
* `pnpm run test:ui:unit` → N/A (no UI/prozess scope)
* `pnpm run test:ui:coverage` → N/A (no UI/prozess scope)
* `pnpm run test:ui:e2e` → N/A (no UI/prozess scope)

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

```md
### Amendment YYYY-MM-DD HH:MM (UTC)
- Section changed: <number>
- Reason:
- Delta:
```

None.
