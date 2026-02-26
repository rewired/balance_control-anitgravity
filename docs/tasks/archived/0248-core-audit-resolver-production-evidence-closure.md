# Task 0248 — CORE Audit: Resolver & Production Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0248-core-audit-resolver-production-evidence-closure`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-007
* GR-011
### compliance_notes (required if affected_guardrails != NONE)
* Preserve canonical resolver ordering.
* Preserve canonical production sweep and majority distribution semantics.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-06-00-05, CORE-01-06-07, CORE-01-06-11, CORE-01-06-17, CORE-01-07-03
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-03:RESOLUTION_ORDER

## 2) Goal
* Add explicit evidence for resolver context binding and production output rules.
* Ensure majority tie/no-control and prohibition-to-zero behaviors are directly tested.

## 3) Non-Goals
* No expansion modifier integration changes.
* No client rendering changes.

## 4) Inputs
* `docs/architecture/CORE-01-OBLIGATIONS.json`
* `packages/game/test/resolver.test.ts`
* `packages/game/test/resolver-invariants.test.ts`
* `packages/integration-tests/test/golden-replay.test.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/engine/resolver.ts` (only if correctness issue found)
* `packages/game/src/engine/atoms/production.ts` (only if correctness issue found)
### 5.2 Tests
* `packages/game/test/resolver.test.ts`
* `packages/game/test/new-core-production-majority-obligations.test.ts`
* `packages/integration-tests/test/golden-replay.test.ts`
### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* Resolver remains the only effect mutation path.

## 7) Invariants (Must remain true)
* Production order and deterministic hashing unchanged except intentional updates.

## 8) Implementation Plan
* [x] Map resolver/production obligations to concrete test assertions.
* [x] Add focused tests where obligations are currently incidental.
* [x] Re-run golden and obligation audits.

## 9) Acceptance Criteria
* [x] Listed resolver/production IDs have direct executable evidence.
* [x] No WEAK/SUSPECT obligations remain in resolver/production cluster.
* [x] Golden replay passes and state hash remains deterministic.

## 10) PR Checklist (Repo Artifact)
* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* Confirmed targeted resolver/production evidence is already direct and executable in `resolver.test.ts`, `new-core-production-majority-obligations.test.ts`, and integration golden replay coverage for tie-production determinism.
* Re-ran obligations audit and confirmed zero WEAK/MISSING/SUSPECT entries for the resolver/production cluster and globally.
* Rebuilt workspace packages to restore package export resolution before running focused suites.
* Re-ran focused resolver/production and golden tests, then full lint/test quality gates for deterministic closure evidence.
## 12) Commands Run (with outcomes)
* `pnpm -w audit:core-obligations` ✅ PASS (Quality stats: WEAK 0, MISSING 0, SUSPECT 0).
* `pnpm vitest run packages/game/test/resolver.test.ts packages/game/test/resolver-invariants.test.ts packages/game/test/new-core-production-majority-obligations.test.ts packages/integration-tests/test/golden-replay.test.ts` ⚠️ INITIAL FAIL (`@balance-control/rules`/`@balance-control/game` export resolution before build).
* `pnpm -r build` ✅ PASS.
* `pnpm vitest run packages/game/test/resolver.test.ts packages/game/test/resolver-invariants.test.ts packages/game/test/new-core-production-majority-obligations.test.ts packages/integration-tests/test/golden-replay.test.ts` ✅ PASS (24 tests).
* `pnpm lint` ✅ PASS.
* `pnpm test` ✅ PASS.
## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
Recorded in final commit message (Postflight: block).
## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
Recorded in final commit message (Postflight: block).
## 15) Amendments (append-only)
* 2026-02-24: Executed in closure mode by validating resolver/production evidence coverage, rerunning audits + deterministic suites, and completing task/changelog artifacts.
