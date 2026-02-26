# Task 0291 — integration cross-expansion matrix suite

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0291-cross-expansion-matrix-suite`

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

* GR-003
* GR-009
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003:
  * Matrix suite enforces deterministic setup with fixed seed and repeated-state hash checks per configuration.
  * No non-deterministic sources are introduced.
* GR-009:
  * Suite asserts expansion-zone isolation and absence when packs are disabled.
  * No-dead-state checks ensure no ghost zones/objects are present for disabled packs.
* GR-012:
  * Matrix uses canonical `packs.enabledPacks` setup config to activate expansion combinations.
  * Assertions are keyed off enabled pack list to verify config-driven state shape.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-03-02A, CORE-01-06-16
* EXP-01: EXP-01-00
* EXP-02: EXP-02-04-B
* EXP-03: EXP-03-06-03, EXP-03-10-02
* ARCH: ARCH-01:DETERMINISM, ARCH-02:EXPANSION_ZONES

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a dedicated integration matrix suite under `packages/integration-tests/test/` that covers the exact eight cross-expansion combinations.
* Assert deterministic initialization via fixed seed and repeated setup hash comparison per matrix row.
* Assert expansion isolation and no-dead-state constraints (no ghost zones/resources/objects for disabled packs).
* Add one relevant stack assertion per row (baseline, blockade/prohibition, climate cost, or climate+regulation cost stacking).
* Expose a dedicated package test script for the matrix suite and keep workspace test flow stable.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No runtime engine rule changes.
* No UI/client-web changes.
* No measure content updates.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/integration-tests/test/`
  * `packages/integration-tests/package.json`
  * `packages/game/src/engine/resolver/costs.ts`
  * `packages/game/src/engine/resolver/prohibitions.ts`
* Existing behavior summary (current):

  * Integration tests had smoke + golden replay coverage, but no explicit eight-row cross-expansion matrix suite.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — no UI/prozess scope.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/integration-tests/test/cross-expansion-matrix.test.ts` (new)
* `packages/integration-tests/package.json`

### 5.2 Tests

* `packages/integration-tests/test/cross-expansion-matrix.test.ts` (new)

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

* [x] Step 1: add dedicated matrix integration suite with exact eight config IDs and fixed-seed setup helper.
* [x] Step 2: implement per-row isolation/dead-state assertions for zones/resources/objects when expansions are disabled.
* [x] Step 3: implement per-row relevant stack assertions (baseline, blockade/prohibition, climate cost, climate+regulation cost stacking).
* [x] Step 4: add dedicated package script for matrix suite and update changelog/task documentation.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Suite contains all 8 exact matrix configuration IDs requested.
* [x] Each matrix row validates deterministic initialization with fixed seed and repeated hash equality.
* [x] Each row includes dead-state/isolation assertions for disabled packs.
* [x] Matrix suite is invokable via package script and passes in workspace context.
* [x] Existing test suites remain stable.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (blocked by pre-existing `packages/bot-llm` dependency resolution failure for `zod`)
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `cross-expansion-matrix.test.ts` with the exact 8 requested configuration IDs from core-only through all expansions.
* Implemented deterministic setup helper with fixed seed and repeated hash checks for each matrix row.
* Added no-dead-state assertions for disabled expansion zones and disabled expansion object/resource leakage.
* Added stack-case checks per matrix row: baseline core, EXP-02 prohibition/blockade-style check, EXP-03 climate cost, and EXP-02+EXP-03 climate+regulation additive cost stacking.
* Added dedicated package script `test:matrix` for focused execution of the new suite.
* Updated changelog and task artifact for traceability.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -C packages/integration-tests test:matrix` → ok (8 tests passed).
* `pnpm -C packages/integration-tests test` → ok.
* `pnpm lint` → ok.
* `pnpm test` → fail (pre-existing workspace issue: `packages/bot-llm` test cannot resolve `zod`, unrelated to this task).

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

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

N/A.
