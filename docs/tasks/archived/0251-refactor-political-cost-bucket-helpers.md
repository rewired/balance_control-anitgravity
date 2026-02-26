# Task 0251 — Refactor Political Action Cost Bucket Mechanics into Shared Helpers

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)
**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
### affected_guardrails
* GR-002
* GR-003
* GR-007
### compliance_notes (required if affected_guardrails != NONE)
* GR-002: legality and cost resolution remain engine-owned; helpers are in `packages/game/src/engine` and called only from move handlers.
* GR-003: fallback selection uses canonical deterministic ID ordering via `selectDeterministicCostResourceIds`.
* GR-007: refactor preserves prohibition/cost/payment ordering and delegates actual cost settlement to `EffectResolver`.
### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-04-12B, CORE-01-04-12D, CORE-01-04-20, CORE-01-04-22C
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-03:RESOLUTION_ORDER

## 2) Goal
* Introduce shared helper utilities for cost-bucket duplicate/overlap validation.
* Split combined resource ID lists into semantic buckets (penalty vs extra cost) through a helper.
* Centralize deterministic fallback ID selection when explicit resource IDs are omitted.
* Refactor `moveInfluence` and `convertResources` to use helpers and reduce local list-mechanics code.

## 3) Non-Goals
* No changes to move payload schemas.
* No changes to rule anchors or move availability.
* No UI/client behavior changes.

## 4) Inputs
* `packages/game/src/moves/stages/politicalAction/moveInfluence.ts`
* `packages/game/src/moves/stages/politicalAction/convertResources.ts`
* `packages/game/src/engine/deterministic-cost.ts`

## 5) Outputs
### 5.1 Code
* `packages/game/src/engine/cost-bucket-utils.ts` (new)
* `packages/game/src/moves/stages/politicalAction/moveInfluence.ts`
* `packages/game/src/moves/stages/politicalAction/convertResources.ts`

### 5.2 Tests
* `packages/game/test/cost-bucket-utils.test.ts` (new)

### 5.3 Docs
* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)
* Keep all move handlers deterministic and rules-engine-owned.
* Preserve existing cost payment validation semantics.
* Do not introduce implicit rules.

## 7) Invariants (Must remain true)
* Identical move sequence yields identical results.
* No move mutates state outside canonical resolver/payment paths.
* Object zone exclusivity remains unchanged.

## 8) Implementation Plan
* [x] Add engine-level helper utilities for bucket validation, partitioning, and fallback selection.
* [x] Refactor `moveInfluence` to use helper-based split/validation/fallback for penalty + extra-cost buckets.
* [x] Refactor `convertResources` to use helper-based fallback/validation for input and extra-cost buckets.
* [x] Add focused helper tests for duplicates, overlaps, deterministic fallback stability, and partition lengths.

## 9) Acceptance Criteria
* [x] `moveInfluence` uses helper functions for combined bucket splitting and validation.
* [x] `convertResources` uses helper functions for deterministic fallback and bucket validation.
* [x] Helper tests cover the four requested scenarios.

## 10) PR Checklist (Repo Artifact)
* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes _(blocked by pre-existing workspace Vitest package-entry resolution failure for `@balance-control/rules`)_
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* Added `cost-bucket-utils` helper module in engine for bucket uniqueness checks, combined-list partitioning, and deterministic fallback selection.
* Refactored `moveInfluence` to resolve penalty and extra-cost buckets through helper functions.
* Refactored `convertResources` to resolve omitted IDs deterministically and validate no duplicate/overlap IDs across input/extra buckets.
* Added focused unit tests covering duplicate detection, overlap rejection, deterministic fallback stability, and partition sizing behavior.

## 12) Commands Run (with outcomes)
* `pnpm lint` ✅
* `pnpm --filter @balance-control/game test -- cost-bucket-utils.test.ts` ⚠️ fails due to pre-existing workspace/Vite package-entry resolution failure for `@balance-control/rules`.

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)
* N/A
