# Task 0361 — replay resolveChoice influence invariants

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `task/0361-replay-resolvechoice-influence-invariants`

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
* GR-006
* GR-007

### compliance_notes (required if affected_guardrails != NONE)

* GR-001:
  * Keep influence state reads/writes inside `packages/game` authoritative state (`G.zones` + `G.objects`).
  * Assertions/projections will only inspect JSON-serializable authoritative state.
* GR-003:
  * Added checks are pure deterministic comparisons of pre/post snapshots.
  * No runtime randomness/time usage introduced.
* GR-006:
  * `resolveChoice` validation path remains the sole legal pending-choice resolver.
  * Invalid choice selections are rejected deterministically.
* GR-007:
  * Changes do not bypass effect queue ordering; `choice.apply` still resolves via resolver pipeline.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, `ARCH-03`), DD absent (no applicable override found), TDD present (this task file), AGENTS present (`/AGENTS.md`), VISION absent (no applicable artifact used).
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-06-05, CORE-01-06-03B
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-03:PENDING_CHOICE, ARCH-03:RESOLUTION_ORDER

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Trace and verify the “Receive 1 Influence” choice flow from `choiceOpened` through `resolveChoice` and `choice.apply`.
* Ensure replay logging asserts that applied `resolveChoice` outcomes with influence effects produce deterministic deltas in authoritative state.
* Ensure checkpoint projection reflects the active player's updated influence counters in the same turn.
* Add replay-focused tests for applied influence choice, invalid selection rejection, and immediate projection visibility.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No UI interaction or modal behavior changes.
* No rule text or expansion behavior changes beyond deterministic validation/projection hardening.
* No new move types or effect kinds.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/moves/system/resolveChoice.ts`
  * `packages/game/src/engine/atoms/choice.ts`
  * `packages/game/src/engine/atoms/hotspot.ts`
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/test/replay-sink.test.ts`
* Existing behavior summary (current):

  * `resolveChoice` enqueues `choice.apply`, which maps selected options to follow-up atoms.
  * Hotspot “Receive 1 Influence” follow-up enqueues `influence.place` on the hotspot tile.
  * Replay sink currently has invariant deltas for `placeInfluence` but not `resolveChoice`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — engine/replay tests only; no `client-web` scope.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/moves/system/resolveChoice.ts`
* `packages/game/src/engine/replay-sink.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
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

* [ ] Step 1: Add deterministic helper assertions in replay sink for `resolveChoice` applied outcomes that involve influence deltas.
* [ ] Step 2: Update checkpoint projection and influence counting to use authoritative zone membership for immediate post-choice visibility.
* [ ] Step 3: Add replay tests covering applied choice gain, invalid choice rejection, and same-turn checkpoint projection.
* [ ] Step 4: Update docs (`docs/changelog.md`) and task checklist/work summary/commands.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `resolveChoice` replay record includes deterministic influence pre/post snapshots with expected delta when an applied choice grants influence.
* [ ] Invalid `resolveChoice` selections are rejected and do not emit applied replay records.
* [ ] `checkpoint.turnEnd` for the same turn reflects updated influence counters for active player after applied choice.
* [ ] Golden replay unchanged or updated intentionally with explanation.

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

* Added strict `resolveChoice` option validation so selections outside `pendingChoice.spec.options` return `INVALID_MOVE` deterministically.
* Hardened replay sink influence projection to read authoritative zone membership instead of non-authoritative object `tileId` fields.
* Added `resolveChoice` replay influence pre/post projections and invariant assertion for “Receive 1 Influence” outcomes (`expectedDelta = {-1,+1}`).
* Extended replay sink tests with three replay fixture-style scenarios: applied influence gain, invalid selection rejected, and same-turn checkpoint projection update.
* Updated canonical changelog and this task artifact per repository execution protocol.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -r build` → OK (workspace packages built successfully).
* `pnpm vitest run packages/game/test/replay-sink.test.ts` → OK (10 tests passed).
* `pnpm vitest run packages/game/test/hotspot_choice.test.ts` → OK (1 test passed).
* `pnpm lint` → OK.
* `pnpm test` → OK (workspace checks and test suites passed).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — engine/replay scope only.

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

---

## 14) Risks / Rollback

* Risk: replay invariants may be overly strict for non-influence choices.
* Mitigation: scope assertions to resolveChoice payloads that produce measurable influence deltas.
* Rollback: revert single commit if replay checks break existing pipelines.

---

## 15) Amendments (append-only)

* None.
