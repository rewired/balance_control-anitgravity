# Task 0232 — Core rule traceability: add precise @rule bindings + curate spec-only list; enable strict gate

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0232-core-rule-traceability-strict-coverage`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-001
* GR-002
* GR-003
* GR-005

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Only documentation tags/comments and audit wiring; no new state fields or derived caches.
* GR-002: `@rule` bindings remain in engine code; UI remains presentation-only.
* GR-003: No nondeterministic sources introduced; tags do not affect runtime.
* GR-005: Do not invent actions/intents to ‘cover’ missing rule IDs; coverage must reflect real implementation.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated, I will STOP and write a DD (design decision) or split the task.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-05:REQUIRED_TAGS
* ARCH: ARCH-05:RULE_BINDING_POLICY
* ARCH: ARCH-01:LEGALITY_ENUMERATION
* ARCH: ARCH-01:DETERMINISM
* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Drive core rule coverage to **zero missing IDs** for the rule set defined by `docs/rules/000-core.md`.
* Ensure every authoritative engine entry point (legal-intent enumeration, move resolvers, effect resolution helpers) carries accurate `@rule RULE_ID` tags per ARCH-05.
* Populate `docs/architecture/CORE-01-SPEC-ONLY.json` with only truly spec-only/definitional IDs (and brief reasons).
* Make coverage enforcement strict by wiring `pnpm audit:core-coverage --strict` into `pnpm audit:spec` (CI gate).

---

## 3) Non-Goals

* No gameplay tuning or refactors beyond adding documentation tags and test annotations.
* No ‘papering over’ real gaps by adding spec-only exemptions to implementable rules.
* No expansion work.

---

## 4) Inputs

* Repo areas:

  * `docs/architecture/core-coverage.report.json (from Task 0231 baseline)`
  * `docs/architecture/CORE-01-SPEC-ONLY.json`
  * `docs/rules/000-core.md`
  * `packages/game/src/**`
  * `packages/game/test/**`
  * `packages/integration-tests/test/**`
  * `package.json (audit scripts)`

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/** (add/adjust TSDoc `@rule` tags where missing/incorrect)`
* `docs/architecture/CORE-01-SPEC-ONLY.json (curated list + brief reasons)`
* `scripts/audit-core-coverage.mjs (add `--strict` mode + exit non-zero when missing)`
* `package.json (wire strict coverage into `audit:spec`)`

### 5.2 Tests

* `packages/game/test/** (add rule-id references in test names/comments where evidence is currently missing)`

### 5.3 Docs

* [ ] `docs/architecture/SPEC-AUDIT.md (coverage is now a blocking stage)`
* [ ] `docs/changelog.md (ONLY if any runtime logic changes occur; tags/tests/scripts do not require changelog)`

---

## 6) Constraints (Hard)

* Precision: `@rule` tags must reference the smallest correct rule IDs; avoid ‘CORE-01-00’ as a catch-all unless truly applicable.
* If a rule ID is implemented by an existing function, prefer adding that ID to the function’s TSDoc `@rule` list (multiple IDs allowed when genuinely cross-cutting).
* Spec-only exemptions must be defensible: only definitional, naming, formatting, or glossary-like rules; NOT gameplay mechanics.
* If coverage reveals a genuine missing mechanic, STOP and create a follow-up task rather than inventing behavior in this task.
* No state-hash drift is allowed in this task (tags/tests only).

---

## 7) Invariants (Must remain true)

* All existing golden replays remain stable (no expected hash updates).
* All existing legal-intent enumerators remain bounded/deterministic.
* Rule ID references remain canonical (must exist in spec anchors registry).

---

## 8) Implementation Plan

* [ ] Run `pnpm audit:core-coverage` and group `missingIds` into: (a) spec-only, (b) implemented but untagged/untested, (c) suspected real gaps.
* [ ] For (b): add accurate `@rule` tags to the implementing engine functions (start with `enumerateLegalIntents`, move resolvers, and effect atoms), and add rule-id mentions in tests that validate the behavior.
* [ ] For (a): add IDs to `CORE-01-SPEC-ONLY.json` with brief reasons (one line each).
* [ ] For (c): do NOT mask; write a small follow-up task stub in Section 15 (Amendments) or as a new numbered task if needed, and keep coverage strictness gated behind completion of that follow-up.
* [ ] Implement `--strict` mode in the audit script and wire `pnpm audit:spec` to run strict coverage (fail on any missing/unclassified IDs).
* [ ] Re-run `pnpm audit:spec` to ensure everything passes with coverage at zero missing IDs.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] `pnpm audit:core-coverage --strict` exits 0 with `missingIds.length == 0`.
* [ ] Every authoritative core entry point touched has accurate `@rule` tags (no broad/ambiguous coverage).
* [ ] `CORE-01-SPEC-ONLY.json` contains only defensible spec-only IDs; no mechanics are exempted.
* [ ] `pnpm audit:spec` includes the strict coverage gate and remains green without updating golden hashes.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash) if applicable
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 12) Commands Run (with outcomes)

* TODO (fill during VERIFYING/COMMIT_READY)

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
