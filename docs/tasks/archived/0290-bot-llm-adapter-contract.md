# Task 0290 — bot-llm adapter contract hardening

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0290-llm-bot-adapter-contract`

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

* GR-004
* GR-005
* GR-013

### compliance_notes (required if affected_guardrails != NONE)

* GR-004:
  * bot-llm legal option surface is produced via `enumerateLegalIntents` only.
  * no secondary legality implementation is introduced in bot-llm.
* GR-005:
  * adapter executes selected intents from enumerated list only.
  * fallback returns an existing enumerated move (index 0), never an invented move.
* GR-013:
  * LLM contract is index-selection only with strict zod validation.
  * invalid/unsafe responses are rejected and replaced by deterministic fallback.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-04-09
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-04:INTERACTION_MODEL, ARCH-04:RESTRICTIONS, ARCH-04:DETERMINISM, ARCH-01:LEGALITY_ENUMERATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Implement a real `packages/bot-llm` adapter that enumerates legal intents deterministically and presents index-addressable options.
* Enforce strict JSON response validation via zod for `{ selectedIndex: number }`.
* Add guardrails for index bounds, stale-option verification, and deterministic fallback selection.
* Add focused unit tests for invalid JSON, schema violation, out-of-range index, and deterministic fallback behavior.
* Update changelog with architecture/rule references for traceability.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No network/model provider integration.
* No changes to engine legality generation logic.
* No UI/client integration changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/bot-llm/src/index.ts`
  * `packages/bot-llm/src/boot.ts`
  * `packages/game/src/engine/legal-intents.ts`
  * `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`
* Existing behavior summary (current):

  * bot-llm only logs bootstrap message and has TODO placeholder.
  * no strict schema validation, no index guardrails, no tests.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

N/A — no client-web/prozess scope in this task.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/bot-llm/src/adapter.ts` (new)
* `packages/bot-llm/src/index.ts`
* `packages/bot-llm/package.json`

### 5.2 Tests

* `packages/bot-llm/test/adapter.test.ts` (new)

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

* [x] Step 1: add bot adapter module with deterministic legal-intent enumeration and strict response parsing schema.
* [x] Step 2: implement guarded selection path with index checks, stale-list verification, and deterministic fallback.
* [x] Step 3: add unit tests for failure/guardrail paths and deterministic fallback behavior.
* [x] Step 4: update changelog and bot package scripts/dependencies needed for tests.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Adapter exposes legal options derived from `enumerateLegalIntents` with stable ordering and index-only selection input.
* [x] Invalid JSON and schema-invalid responses return deterministic fallback without throwing uncaught errors.
* [x] Out-of-range or stale indices are rejected and replaced with deterministic fallback from current legal list.
* [x] `packages/bot-llm` tests pass and assert deterministic fallback path.
* [x] Golden replay unchanged (task scope does not alter engine move/state transitions).

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (blocked by pre-existing unrelated failure in `packages/game/test/new-core-settlement-endgame-obligations.test.ts`)
* [x] Determinism verified (bot adapter fallback is deterministic; repeated stale-selection assertion is stable)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `packages/bot-llm/src/adapter.ts` with deterministic legal-move enumeration, strict `{ selectedIndex }` schema validation, and guarded selection entrypoint.
* Enforced index range checks and stale selection verification against current legal-move list before accepting LLM selection.
* Implemented deterministic fallback that always selects the first current legal move when response JSON/schema/index is invalid.
* Exported adapter API from `packages/bot-llm/src/index.ts` for downstream integration.
* Added `packages/bot-llm/test/adapter.test.ts` covering invalid JSON, schema violation, out-of-range index, and deterministic stale-fallback path.
* Updated `packages/bot-llm/package.json` scripts/dependencies (`test`, `pretest`, `zod`, `vitest`) and added changelog entry with CORE/ARCH references.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -C packages/bot-llm test` → fail initially (`@balance-control/game` unresolved before dependency prebuild step).
* `pnpm install` → ok (workspace install/update).
* `pnpm -C packages/bot-llm test` → ok (4 tests passed) after pretest/dependency fixes.
* `pnpm lint` → ok.
* `pnpm test` → fail (pre-existing unrelated failure in `packages/game/test/new-core-settlement-endgame-obligations.test.ts`, assertion expecting non-`INVALID_MOVE`).

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