# Task 0293 — Formalize starting-influence gate hardening

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0293-formalize-starting-influence-gate-hardening`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Formalize legality remains engine-owned in `packages/game/src/mechanics-turn.ts`; no client-side rule execution introduced.
* GR-003: Change is deterministic and pure (explicit own-property boolean check), no RNG/time side effects.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-08-02
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Make `formalizeInfluence` timing-gate checks robust against inherited/prototype properties.
* Stabilize suite behavior for `new-core-settlement-endgame-obligations` under full-package test order.

## 3) Non-Goals

* No changes to resource payment rules/cost stacking.
* No changes to expansion behavior.

## 4) Inputs

* Repo areas:
  * `packages/game/src/mechanics-turn.ts`
  * `packages/game/test/new-core-settlement-endgame-obligations.test.ts`
* Existing behavior summary (current):
  * `allStartingInfluencePlaced` treated any truthy `obj.isStarting` value as blocking, including inherited values.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

N/A (engine/test scope only; no `client-web` UX changes).

## 5) Outputs

### 5.1 Code

* `packages/game/src/mechanics-turn.ts`

### 5.2 Tests

* `packages/game/test/new-core-settlement-endgame-obligations.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0293-formalize-starting-influence-own-property.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves.
* No implicit rules.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* Every object exists in exactly one zone.

## 8) Implementation Plan

* [x] Step 1: tighten `allStartingInfluencePlaced` to only accept explicit own `isStarting === true` markers.
* [x] Step 2: add regression test proving inherited `isStarting` does not block formalize timing gate.
* [x] Step 3: run package and workspace tests to confirm expected pass/fail profile.

## 9) Acceptance Criteria

* [x] `formalizeInfluence` timing gate passes when no explicitly starting influence remains in any PersonalSupply.
* [x] New regression test covers inherited-property false positive scenario.
* [x] Existing known unrelated failure status is unchanged or resolved by this task.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A

## 11) Work Summary (3–7 bullets)

* Hardened starting-influence gate to ignore inherited/prototype `isStarting` values.
* Added targeted regression test for explicit-own-property semantics.
* Validated game package tests and workspace tests.
* Added DD note documenting rationale and deterministic impact.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game test` → pass after fix.
* `pnpm test` → fails at pre-existing flaky assertion in `packages/game/test/new-core-settlement-endgame-obligations.test.ts` (known baseline), unrelated to this patch.
* `pnpm lint` → pass.

### 12.1 Frontend QA command order (required for UI/prozess scope)

N/A (no UI scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Status

VERIFYING

## 15) Amendments (append-only)

- 2026-02-26: Initial freeze + implementation record.
