# Task 0243 — CORE actions/settlement/endgame evidence hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0243-core-actions-settlement-endgame-evidence-hardening`

---

**Task State:** DRAFT

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-004
* GR-006
* GR-007
* GR-008
* GR-011

### compliance_notes (required if affected_guardrails != NONE)

* GR-004/GR-006: legal action gating and pending-choice behavior must be test-proven.
* GR-007/GR-011: production/effect resolution order must remain canonical and deterministic.
* GR-008: no implicit triggers; each tested behavior maps to explicit CORE anchor.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-11A, CORE-01-04-12D, CORE-01-04-14B, CORE-01-04-20..30, CORE-01-05-* (control/majority), CORE-01-06-00-03, CORE-01-06-16, CORE-01-07-01..03D, CORE-01-08-* (restrictions), CORE-01-09-* (end game), CORE-01-10-* (hierarchy)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-03:RESOLUTION_ORDER, ARCH-01:LEGALITY_ENUMERATION

## 2) Goal

* Close weak evidence on political actions, settlement ordering, restrictions, and end-game obligations.
* Add direct, named tests for obligations currently inferred only via broad integration tests.
* Produce clear rule-to-test mapping for CORE-only behavior.

## 3) Non-Goals

* No expansion interactions.
* No bot-LLM behavior changes.

## 4) Inputs

* Repo areas:
  * packages/game/src/moves/
  * packages/game/src/engine/atoms/
  * packages/game/src/engine/resolver.ts
  * packages/game/test/moves.test.ts
  * packages/game/test/resolver.test.ts
  * packages/game/test/turn.test.ts
  * packages/integration-tests/test/golden-replay.test.ts
* Existing behavior summary (current): many obligations rely on broad test files, but anchor-specific assertions are sparse.

## 5) Outputs

### 5.1 Code

* packages/game/src/moves/* (only if failing tests expose non-compliance)
* packages/game/src/engine/atoms/* (only if failing tests expose non-compliance)

### 5.2 Tests

* packages/game/test/moves.test.ts
* packages/game/test/resolver.test.ts
* packages/game/test/turn.test.ts
* packages/game/test/new-core-settlement-endgame-obligations.test.ts (if needed)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.

## 8) Implementation Plan

* [ ] Step 1: Enumerate weak/suspect action+settlement obligations and add failing tests per rule.
* [ ] Step 2: Apply minimal behavior fixes where tests fail.
* [ ] Step 3: Update obligations evidence links and rerun audit scripts.

## 9) Acceptance Criteria

* [ ] All targeted obligations have direct test assertions in CORE-only suites.
* [ ] `pnpm -C packages/game test -- moves.test.ts resolver.test.ts turn.test.ts` passes.
* [ ] `pnpm -C packages/integration-tests test -- golden-replay.test.ts` remains green.

## 10) PR Checklist (Repo Artifact)

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

## 11) Work Summary (3–7 bullets)

* N/A

## 12) Commands Run (with outcomes)

* N/A

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>
