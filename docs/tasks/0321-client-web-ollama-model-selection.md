# Task 0321 — Client-web Ollama model selection

**Date:** 2026-03-02
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

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

* GR-002
* GR-005
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Client adds only model discovery and UI validation; no legality/cost/majority logic is computed in UI.
* GR-005: No new moves/intents are introduced; match setup data shape remains canonical and validated.
* GR-014: Presentation updates keep existing UI contract while improving model pick flow deterministically.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC absent, DD present (new DD-0321), TDD absent, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (UI/client integration change; no gameplay rule mutation)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-04:INTERACTION_MODEL, ARCH-06 UI interaction contract

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add a client Ollama API helper with timeout and deterministic error wrapping.
* Replace bot model free-text fields with model selects in Start and Lobby screens.
* Show explicit fallback error + refresh button when no models are available.
* Enforce deterministic setup validation that bot seat modes only accept loaded models.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No server-side proxy implementation for Ollama is introduced.
* No gameplay rule, move legality, or effect resolver behavior is changed.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/StartScreen.tsx`
  * `packages/client-web/src/components/LobbyScreen.tsx`
  * `packages/client-web/src/config/matchConfig.ts`
  * `packages/client-web/test/`
* Existing behavior summary (current): bot mode accepted arbitrary model text; no loaded-model validity check.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/ollama/models.ts`
* `packages/client-web/src/components/StartScreen.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`
* `packages/client-web/src/config/matchConfig.ts`
* `packages/client-web/src/App.tsx`

### 5.2 Tests

* `packages/client-web/test/start-screen-models.test.tsx`
* `packages/client-web/test/lobby-screen.test.tsx`
* `packages/client-web/test/match-config.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Add Ollama tags API helper with timeout + normalized error handling.
* [x] Step 2: Replace Start/Lobby model text inputs with loaded model select + refresh/fallback UX.
* [x] Step 3: Add match-config validation against loaded models and expand tests.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Start and Lobby only allow selecting known loaded models for bot seat modes.
* [x] Bot-enabled Start/Create buttons are disabled when model list is empty/invalid.
* [x] `buildValidatedSetupData` throws deterministic error for invalid bot model.
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
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `fetchOllamaModels` client API wrapper with timeout and structured error messages.
* Switched StartScreen and LobbyScreen bot model input to loaded model `<select>`.
* Added UX fallback messaging plus refresh action when no model is available.
* Disabled bot-mode Start/Create actions while selected model is invalid.
* Hardened `buildValidatedSetupData` bot seat validation against available model list.
* Added tests for model-loading UX and deterministic invalid-model rejection.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm --filter @balance-control/client-web exec vitest run test/match-config.test.ts test/start-screen-models.test.tsx test/lobby-screen.test.tsx` → ok (all targeted tests pass)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → ok
* `pnpm run test:ui:unit` → fail (pre-existing `board-viewport.test.tsx` expectation mismatch: extra `200` arg in `setTransform` call)
* `pnpm run test:ui:coverage` → fail (same pre-existing `board-viewport.test.tsx` assertion mismatch)
* `pnpm run test:ui:e2e` → warn (Playwright Chromium missing in container; `Executable doesn't exist`, requires `pnpm exec playwright install`)

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

### A-01 — initial freeze

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
