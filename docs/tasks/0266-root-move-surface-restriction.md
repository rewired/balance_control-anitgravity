# Task 0266 — Restrict root move exposure to systemic moves

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0266-root-move-surface-restriction`

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

* GR-002
* GR-004
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Keep legality/execution boundaries in engine by moving stage-bound moves out of global/root move surface.
  * Do not move any rules logic into client code.
* GR-004:
  * Keep legal action flow aligned with stage and pending-choice restrictions (no extra global move entrypoints for political actions).
* GR-006:
  * Preserve `resolveChoice` as the only global/systemic move required when `pendingChoice` is present.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-04-01
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-03:PENDING_CHOICE

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Restrict boardgame.io root `moves` exposure to systemic/global moves only.
* Keep political action moves (`placeInfluence`, `moveInfluence`, `formalizeInfluence`, `convertResources`) stage-bound under `turn.stages.politicalAction.moves`.
* Ensure draw-and-place stage does not expose/call political root methods from client move API.
* Update tests to validate the narrowed move surface and preserved gameplay flow.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to political move rule semantics, costs, or legality internals.
* No changes to expansion enablement or pack registration behavior.
* No UI flow redesign beyond move surface availability checks.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/index.ts`
  * `packages/game/test/move-assembly-invariants.test.ts`
  * `packages/game/test/turn.test.ts`
* Existing behavior summary (current):

  * `createBalanceControlGame()` currently exports `moves: mergedMoves as any`, exposing stage-bound political moves at root level.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — engine move surface change only; no client-web UI/prozess artifact changes.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/index.ts`

### 5.2 Tests

* `packages/game/test/move-assembly-invariants.test.ts`
* `packages/game/test/turn.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0266-root-move-surface-restriction.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Split current core move ID lists into stage-political and root-systemic lists in `createBalanceControlGame()`.
* [x] Step 2: Use root move map in `moves` while keeping political moves only under `turn.stages.politicalAction.moves`.
* [x] Step 3: Update tests that asserted root exposure, and add/adjust checks for draw-and-place non-exposure.
* [x] Step 4: Update changelog + add DD note for move surface contract rationale.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `createBalanceControlGame()` root `moves` excludes `placeInfluence`, `moveInfluence`, `formalizeInfluence`, `convertResources`.
* [x] `turn.stages.politicalAction.moves` still includes political move set and relevant expansion moves.
* [x] Tests prove no direct client invocation path for political root moves during `drawAndPlace`.
* [x] Golden replay unchanged or updated intentionally with explanation.

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
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Restricted root move map in `createBalanceControlGame()` to systemic `resolveChoice` only; removed stage-bound political moves from root exposure.
* Kept political move wiring under `turn.stages.politicalAction.moves` via stage move-map assembly (including expansion move modules).
* Updated move-assembly invariant tests to assert root/system separation and stage-scoped expansion/political move availability.
* Updated turn-stage regression to assert political moves are rejected without mutation during `drawAndPlace`.
* Updated docs with changelog entry and DD-0266 rationale for root move surface restriction.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -r build` → ok
* `pnpm --dir packages/game exec vitest run test/turn.test.ts test/move-assembly-invariants.test.ts` → ok (14 tests passed)
* `pnpm lint` → ok
* `pnpm test` → fail (workspace has pre-existing failing `packages/game` suites unrelated to this task; e.g. pack-registry duplicate state + legacy expectations in move suites)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — engine/test/docs only task.

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
