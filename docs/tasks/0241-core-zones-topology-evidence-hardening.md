# Task 0241 — CORE zones + topology evidence hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0241-core-zones-topology-evidence-hardening`

---

**Task State:** DRAFT

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

* GR-003
* GR-009
* GR-011

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: add deterministic topology and order assertions only; no non-seeded randomness/time APIs.
* GR-009: prove zone exclusivity and movement invariants via executable tests, not comments.
* GR-011: verify adjacency/topology behavior without altering production semantics.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-00-02, CORE-01-00-03, CORE-01-00-04, CORE-01-00-05A, CORE-01-00-08, CORE-01-00-09, CORE-01-00-10, CORE-01-00-11, CORE-01-00-T01, CORE-01-00-T02, CORE-01-00-T03, CORE-01-00-T07, CORE-01-00-T07A, CORE-01-00-T08
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-02:ZONE_MODEL

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add missing CORE-only tests proving zone transfer and ordered zone semantics.
* Add topology contract tests for Adjacent/NeighborPositions/PositionKey determinism.
* Strengthen evidence quality for obligations currently backed by type/schema files only.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No UI behavior or styling changes.
* No expansion logic changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * packages/game/src/engine/topology.ts
  * packages/game/src/topology.ts
  * packages/rules/src/zones.ts
  * packages/game/test/core-compliance-invariants.test.ts
* Existing behavior summary (current):

  * Several topology/zone obligations are only evidenced by source references without direct tests.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* packages/game/src/engine/topology.ts (only if assertion hooks required)

### 5.2 Tests

* packages/game/test/core-compliance-invariants.test.ts
* packages/game/test/engine-topology.test.ts
* packages/game/test/new-core-zone-topology-obligations.test.ts (if needed)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
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

* [ ] Step 1: Add CORE-anchored failing tests for each weak topology/zone obligation.
* [ ] Step 2: Implement minimal engine/rules fixes only if tests reveal behavior gaps.
* [ ] Step 3: Update CORE obligations evidence entries to point to concrete test names/files.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] All listed CORE anchors have executable tests with direct assertions.
* [ ] `pnpm -C packages/game test -- engine-topology.test.ts core-compliance-invariants.test.ts` passes.
* [ ] `pnpm run audit:core-obligations` stays green with updated evidence paths.

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
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* N/A

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* N/A

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
