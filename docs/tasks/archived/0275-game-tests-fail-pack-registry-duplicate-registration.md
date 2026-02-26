# Task 0275 — Game tests fail due to duplicate pack registration state leakage

**Date:** 2026-02-25
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0275-game-tests-fail-pack-registry-duplicate-registration`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Changes are test-isolation and registry singleton lifecycle hardening only.
  * Rule execution remains engine-owned; no client-side legality/cost execution added.
* GR-003:
  * Registry initialization/ordering remains deterministic.
  * Added deterministic singleton resolution via `globalThis` key; no randomness/time coupling introduced.
* GR-012:
  * Pack enablement source remains `cfg`/`G.meta.cfg` path.
  * No alternate expansion-enable authority introduced.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A.1
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Eliminate duplicate pack registration leakage across game test suites.
* Keep pack registry behavior deterministic and compatible with existing duplicate rejection rules.
* Stabilize `pnpm -w test` so the workspace test pipeline passes end-to-end.

## 3) Non-Goals

* No gameplay-rule semantic changes.
* No changes to legal intent contracts.
* No UI behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/expansion-registry.ts`
  * `packages/game/test/*`
  * `docs/changelog.md`
* Existing behavior summary (current):
  * Several game tests intermittently failed due to apparent pack registration bleed/instability.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope).

## 5) Outputs

### 5.1 Code

* `packages/game/src/expansion-registry.ts`

### 5.2 Tests

* `packages/game/test/engine-pack-registry.test.ts`
* `packages/game/test/move-assembly-invariants.test.ts`
* `packages/game/test/pack-disablement-isolation.test.ts`
* `packages/game/test/measure-dispatch-collision.test.ts`
* `packages/game/test/expansion.test.ts`
* `packages/game/test/setup.test.ts`
* `packages/game/test/pack-registry-setup.test.ts`
* `packages/game/test/moves.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:
  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

## 8) Implementation Plan

* [x] Step 1: Reproduce failures and isolate duplicate-pack leakage vectors in registry-centric suites.
* [x] Step 2: Harden registry lifecycle by ensuring single deterministic runtime registry instance.
* [x] Step 3: Add explicit per-test reset calls in flaky suites.
* [x] Step 4: Re-run game and workspace test pipelines.
* [x] Step 5: Update changelog and task artifact.

## 9) Acceptance Criteria

* [x] Registry duplicate tests behave deterministically and fail only when intended.
* [x] Previously failing suites pass in `packages/game`.
* [x] `pnpm -w test` passes.
* [x] Golden replay unchanged or updated intentionally with explanation.

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added `globalThis`-backed singleton resolution for `EnginePackRegistry` to avoid multi-instance drift.
* Added explicit registry resets in registry-sensitive tests to harden isolation.
* Hardened `moves.test.ts` with explicit harness reset calls on flaky cases.
* Repaired setup/registry hook tests to reset state explicitly per case.
* Updated changelog and completed task artifact.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/engine-pack-registry.test.ts test/move-assembly-invariants.test.ts test/pack-disablement-isolation.test.ts test/measure-dispatch-collision.test.ts test/expansion.test.ts --no-threads --sequence.concurrent false` → pass
* `pnpm -C packages/game test` → pass
* `pnpm -w test` → pass

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope)

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

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
