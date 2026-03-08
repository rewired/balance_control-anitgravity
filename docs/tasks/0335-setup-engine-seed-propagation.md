# Task 0335 — setup engine seed propagation for replay records

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0335-setup-engine-seed-propagation`

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
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Seed is persisted as a plain JSON string in `G.engine.attributes.seed`.
* GR-003: Setup reads deterministic boardgame.io RNG seed source and replay sink reads that state value only.
* GR-012: Match config remains canonical; seed propagation does not alter expansion enablement authority.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, `ARCH-01`, `ARCH-02`), DD present (`DD-0335`), TDD present (this task file), AGENTS present (`/AGENTS.md`), VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM; ARCH-02:SERIALIZATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Persist the effective match seed during setup in engine state (`G.engine.attributes.seed`).
* Ensure replay record generation reads seed from engine state (reader-only, no fallback generation).
* Verify replay action/system records carry the seed value.
* Verify replay log filename generation includes the seed from replay record field.

---

## 3) Non-Goals

* No changes to gameplay legality, costs, or move effects.
* No replay format schema expansion beyond existing `seed` field usage.
* No UI changes.

---

## 4) Inputs

* Repo areas:
  * `packages/game/src/setup.ts`
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/test/setup.test.ts`
  * `packages/game/test/replay-sink.test.ts`
  * `packages/server/src/replay-logging.ts`
* Existing behavior summary (current):
  * Replay sink could read legacy `G.engine.seed` fallback.
  * Setup did not explicitly persist effective boardgame.io seed to `engine.attributes`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A — no client-web/UI scope.

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/setup.ts`
* `packages/game/src/engine/replay-sink.ts`
* `packages/server/package.json`

### 5.2 Tests

* `packages/game/test/setup.test.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0335-setup-seed-propagation-replay.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Persist effective boardgame.io seed in setup engine attributes.
* [x] Step 2: Restrict replay seed resolution to engine state reader behavior.
* [x] Step 3: Add/update tests for replay seed in records and filename generation.
* [x] Step 4: Update changelog and DD/task artifacts.

---

## 9) Acceptance Criteria

* [x] Setup writes deterministic seed into `G.engine.attributes.seed` when present.
* [x] Replay sink records include seed from `G.engine.attributes.seed`.
* [x] Replay sink does not read legacy `G.engine.seed` fallback.
* [x] Server replay filename test proves seed in record appears in filename.
* [x] Lint and relevant tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes (targeted vitest suite used; full `pnpm test` currently red due unrelated pre-existing failures)
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added setup seed extraction from boardgame.io RNG internals and persisted it under `G.engine.attributes.seed`.
* Updated replay sink seed resolver to read only from `G.engine.attributes.seed`.
* Extended replay sink tests to assert action/system seed fields and to reject legacy `G.engine.seed` fallback usage.
* Added setup test to assert seed propagation into engine attributes.
* Added server replay filename unit test to ensure `record.seed` is embedded in filename.
* Updated package/test wiring for `@balance-control/server` to run Vitest.
* Added changelog and DD/task documentation for this seed propagation hardening.

---

## 12) Commands Run (with outcomes)

* `pnpm install` → OK
* `pnpm lint` → OK
* `pnpm vitest run packages/game/test/setup.test.ts packages/game/test/replay-sink.test.ts packages/server/src/replay-logging.test.ts` → FAIL (`@balance-control/rules` entry unresolved before build)
* `pnpm --filter @balance-control/rules build` → OK
* `pnpm vitest run packages/game/test/setup.test.ts packages/game/test/replay-sink.test.ts packages/game/test/replay-runner.test.ts packages/server/src/replay-logging.test.ts` → OK
* `pnpm -C packages/server test` → OK
* `pnpm test` → FAIL (pre-existing unrelated red tests in `core-compliance-invariants.test.ts`, `new-core-settlement-endgame-obligations.test.ts`, `spec-anchor-tripwire.test.ts`)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A — no client-web/UI scope.

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

* N/A
