# Task 0267 — Legal intents stage authority draw safety

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0267-legal-intents-stage-authority-draw-safety`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-004
* GR-005

### compliance_notes

* GR-002: stage-gated legality remains engine-owned in `enumerateLegalIntents`.
* GR-004: legal actions continue to be enumerated only through `enumerateLegalIntents` with stricter stage authority.
* GR-005: conservative draw fallback prevents phantom political intents in draw contexts.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-05A, CORE-01-04-09
* ARCH: ARCH-01:LEGALITY_ENUMERATION, ARCH-01:CLIENT_RESTRICTIONS
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A

---

## 2) Goal

* Make stage detection in legal-intent enumeration robust and authoritative.
* Avoid political intent generation during draw-stage states.
* Keep best-effort stage inference only as a narrow fallback.
* Add regression tests for draw/political stage behavior.

---

## 3) Non-Goals

* No changes to political action rules/cost semantics.
* No changes to boardgame.io turn configuration.
* No UI behavior changes.

---

## 4) Inputs

* `packages/game/src/engine/legal-intents.ts`
* `packages/game/test/legal-intents.test.ts`

### 4.1 QA Runbook Baseline

N/A — engine/test/docs only, no client-web UI scope.

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/legal-intents.ts`

### 5.2 Tests

* `packages/game/test/legal-intents.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0267-legal-intents-stage-authority.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Determinism preserved.
* Engine-only legality preserved.
* No phantom moves introduced.
* No implicit rules introduced.

---

## 7) Invariants

* Enumeration remains pure and deterministic.
* Pending-choice hard gate behavior remains unchanged.
* Draw-stage must not surface political actions.

---

## 8) Implementation Plan

* [x] Read stage from `ctx.activePlayers[playerID]` when activePlayers exists.
* [x] Restrict best-effort inference to missing `ctx.activePlayers` scenarios.
* [x] Add draw indicators + conservative default in `inferStageBestEffort`.
* [x] Add tests for draw-stage without staged tile and political-stage expectations.

---

## 9) Acceptance Criteria

* [x] Draw-stage snapshots do not emit political intents.
* [x] `convertResources` is absent in draw-stage snapshots.
* [x] Political-stage snapshots still emit political intents.
* [x] Best-effort inference only runs when `ctx.activePlayers` is absent.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed with compliance notes
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (untouched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or focused vitest) passes
* [x] Determinism verified (no non-deterministic code paths introduced)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or N/A with reason

---

## 11) Work Summary

* Added `resolvePlayerStage` to enforce `ctx.activePlayers[playerID]` as primary stage authority.
* Limited best-effort stage inference to absent `ctx.activePlayers` cases.
* Made best-effort stage detection draw-conservative and expanded draw indicators.
* Added draw-stage regression with empty staging to block political/convert intents.
* Added political-stage regression to ensure political intents are still emitted.
* Updated changelog and created DD-0267.

---

## 12) Commands Run (with outcomes)

* `pnpm --dir packages/game exec vitest run test/legal-intents.test.ts` → ok
* `pnpm lint` → ok

### 12.1 Frontend QA command order

N/A — no UI scope.

---

## 13) Postflight Proof (recorded in commit message)

Required commands captured in final commit message `Postflight:` block:

* `git status -sb`
* `git diff --stat`
* `pnpm --dir packages/game exec vitest run test/legal-intents.test.ts`
* `git show -1 --stat`

---

## 14) Risks / Follow-ups

* If external callers provide malformed `activePlayers`, conservative draw fallback may hide political intents instead of surfacing unsafe ones (intentional safety tradeoff).

---

## 15) Amendments (append-only)

* N/A
