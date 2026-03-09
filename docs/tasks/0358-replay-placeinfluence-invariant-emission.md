# Task 0358 — Replay placeInfluence invariant emission hardening

**Date:** 2026-03-09
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
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-003
* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-001:
  * Invariant projection reads authoritative `G.objects` only and emits replay metadata; no new persisted derived state fields are stored.
* GR-003:
  * Invariant checks and error records derive from deterministic pre/post counts and stable deltas.
* GR-002:
  * Legality/effects remain engine-owned; replay layer only validates post-move authoritative state and reports deterministic errors.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, `ARCH-01`, `ARCH-05`), DD present (replay DDs incl. DD-0340), TDD present (this task file), AGENTS present (repo root), VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-04-10
* CORE: CORE-01-04-11A
* ARCH: ARCH-01:STATE_AUTHORITY
* ARCH: ARCH-01:DETERMINISM

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add deterministic replay invariant checks for `placeInfluence` projections.
* Ensure replay emission does not silently checkpoint inconsistent influence deltas.
* Extend replay sink tests to cover success, illegal move, and invariant mismatch paths.
* Document replay invariant expectations for downstream validators.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to gameplay legality or move effect semantics in resolver/move code.
* No replay verifier rule additions beyond documenting schema expectations.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/test/replay-sink.test.ts`
  * `docs/replay-format-v2.md`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * Replay action records always emitted `resolved.outcome: "applied"` for successful moves without post-move delta invariant checks for `placeInfluence`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — task scope is engine replay emission/tests/docs only.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Add `placeInfluence` pre/post replay projection and deterministic invariant assertion in replay emission path.
* [x] Step 2: Emit deterministic replay error action record on invariant mismatch and avoid silent checkpoint emission for that path.
* [x] Step 3: Add replay sink tests for applied success, illegal move, and mismatch error paths.
* [x] Step 4: Update replay format v2 docs and changelog with invariant contract.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Successful `placeInfluence` replay action includes authoritative influence pre/post projection and expected/observed deltas.
* [x] Illegal/failed `placeInfluence` emits no replay action record.
* [x] Invariant mismatch emits deterministic error action record and does not silently emit a checkpoint for that move.
* [x] Replay format v2 documentation describes `placeInfluence` invariant for validator enforcement.
* [x] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added deterministic replay-time influence projection helper for per-player `personalSupply` and `board` counts.
* Added `placeInfluence` post-move invariant enforcement in replay emission path.
* Added deterministic replay error action emission (`PLACE_INFLUENCE_INVARIANT_FAILED`) when invariant fails.
* Ensured mismatch path avoids silent normal action/checkpoint emission for the same move.
* Extended replay sink tests for successful placement projection payload, illegal placement omission, and mismatch error path.
* Documented invariant in replay format v2 and updated changelog.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts` → ok (all tests passed)
* `pnpm -C packages/game exec vitest run test/replay-verify.test.ts` → ok (all tests passed)
* `pnpm test` → ok (workspace checks and all package test suites passed)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → N/A (non-UI task)
* `pnpm run test:ui:unit` → N/A (non-UI task)
* `pnpm run test:ui:coverage` → N/A (non-UI task)
* `pnpm run test:ui:e2e` → N/A (non-UI task)

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

### A-01 — N/A

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
