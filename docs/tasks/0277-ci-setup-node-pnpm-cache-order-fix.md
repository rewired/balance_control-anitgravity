# Task 0277 — CI setup-node pnpm cache order fix

**Date:** 2026-02-25
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

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (CI/workflow-only change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT.md (documentation artifacts required)

## 2) Goal

* Fix GitHub Actions failure where `actions/setup-node@v4` cannot find `pnpm` while `cache: pnpm` is enabled.
* Preserve deterministic Node + pnpm provisioning via Corepack.
* Keep existing CI job/test flow unchanged aside from bootstrap ordering behavior.

## 3) Non-Goals

* No gameplay or engine behavior changes.
* No UI behavior changes.
* No rule/spec anchor registry changes.

## 4) Inputs

* Repo areas:
  * `.github/workflows/ci.yml`
  * `docs/changelog.md`
  * `docs/design-decisions/`
* Existing behavior summary (current):
  * CI can fail during `setup-node` with `Unable to locate executable file: pnpm` because pnpm cache resolution runs before Corepack activation.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (workflow bootstrap reliability only; no client-web UX/interaction changes).

## 5) Outputs

### 5.1 Code

* `.github/workflows/ci.yml`

### 5.2 Tests

* N/A (no new tests; existing workspace gates re-run)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

## 8) Implementation Plan

* [x] Step 1: Remove `cache: pnpm` options from each `actions/setup-node@v4` step in CI workflow.
* [x] Step 2: Keep Corepack pnpm activation sequence unchanged in each job.
* [x] Step 3: Run lint and test gates to confirm workflow-facing commands remain green.
* [x] Step 4: Record changelog + DD + task artifacts.

## 9) Acceptance Criteria

* [x] Workflow no longer requires pnpm to exist during `setup-node` initialization.
* [x] CI still provisions pnpm via Corepack in each job before install.
* [x] `pnpm lint` and `pnpm test` pass locally.
* [x] Golden replay unchanged or updated intentionally with explanation.

## 10) PR Checklist (Repo Artifact)

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

## 11) Work Summary (3–7 bullets)

* Removed `setup-node` pnpm cache configuration from all three CI jobs.
* Preserved Corepack-based pnpm activation and pinned versioning.
* Eliminated the bootstrap failure mode where setup-node errors before pnpm exists on PATH.
* Added DD-0277 documenting the bootstrap-order decision and alternatives.
* Updated changelog and completed task artifact.

## 12) Commands Run (with outcomes)

* `pnpm lint` → pass
* `pnpm test` → pass

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI behavior change; CI bootstrap-only scope)

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

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
