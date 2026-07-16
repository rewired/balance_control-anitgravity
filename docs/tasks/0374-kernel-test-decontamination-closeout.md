# Task 0374 — Kernel Test Decontamination Closeout

**Date:** 2026-07-16
**Owner:** Claude (Sonnet 5)
**Branch:** `task/0366-core-extraction-root-pack-contract`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

- NONE (test-only changes; no engine/rule behavior touched)

### compliance_notes

- N/A

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (test infrastructure only)
- ARCH: DD-0366 Decision 5 (kernel-test decontamination policy)

## 2) Goal

Close out DD-0366 Decision 5. Most of this task's originally-planned scope (relocating tests broken by the source move, copying synthetic-pack helpers, adding the durable `no-core-package-imports.test.ts` guardrail) was necessarily completed reactively during Task 0373, since the build/tests had to stay green at every step. This task covers what remained:

- Verify the final `packages/game/test/**` suite (11 files) is genuinely pack-agnostic — none use `registerTestPacks`/real `CorePack`, none import `@balance-control/core`.
- Discover and fix a real, if narrow, coverage gap in `tripwire-controller-grants-policy.test.ts`: its `REQUIRED_PACKAGES` sanity-check list didn't include `'core'`, even though its generic file-walker (`listSourceFiles`) already scanned `packages/core/src` correctly. Without this, a future regression that silently broke scanning of `packages/core` specifically would not have been caught by the "did we actually scan this package" assertion.
- Give `packages/core/test/pack-integrity.test.ts` real assertions (it was a placeholder smoke test since Task 0372), mirroring `packages/expansion-01/test/pack-integrity.test.ts`'s pattern: pack id/manifest, moves, atoms, and — CORE-specific — the full root-pack contract (`setupGame`/`turn`/`endIf`/`playerView`/`enumerateIntents`/`updateStats`/`wrapMovesForReplay`).

## 3) Non-Goals

- Does not re-litigate which tests belong in `packages/core/test` vs `packages/game/test` — that triage already happened during Task 0373 (mechanically forced by broken imports) and is not being second-guessed here. All 43 tests that moved there depend on real `CorePack` behavior or CORE-specific fixtures; none were found to be candidates for "pull back to kernel with a synthetic pack" on inspection.

## 4) Inputs

- `packages/game/test/**` (11 remaining files, post-Task-0373)
- `packages/core/test/pack-integrity.test.ts` (Task 0372 placeholder)
- `packages/expansion-01/test/pack-integrity.test.ts` (structural template)

## 5) Outputs

### 5.1 Code

- `packages/game/test/tripwire-controller-grants-policy.test.ts` — added `'core'` to `REQUIRED_PACKAGES`
- `packages/core/test/pack-integrity.test.ts` — real assertions replacing the placeholder

### 5.2 Tests

- Both files above are themselves tests; no separate test files added.

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- N/A — test-only, no engine behavior touched.

## 7) Invariants (Must remain true)

- N/A — no runtime behavior changed by this task.

## 8) Implementation Plan

- [x] Step 1: Audit `packages/game/test/**`'s remaining 11 files — confirm none import `@balance-control/core` or call `registerTestPacks`/reference real `CorePack` (grep-verified: only the guardrail test itself matches, on its own detection pattern).
- [x] Step 2: Audit `tripwire-controller-grants-policy.test.ts` and `spec-anchor-tripwire.test.ts` for hardcoded package lists that might have missed `packages/core`. Found and fixed one (`REQUIRED_PACKAGES` in the former); confirmed the latter has no such list (fully generic recursive scan).
- [x] Step 3: Write real `pack-integrity.test.ts` assertions for `CorePack` (id/manifest, 6 CORE-01 moves, setup hooks, non-empty atom registration, full root-pack contract, turn stage structure).
- [x] Step 4: Full verification: `packages/game` test suite, `packages/core` test suite, full workspace build, full `audit:spec` gate.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game test` — 11/11 files, 23/23 tests pass (including the strengthened tripwire test).
- [x] `pnpm -C packages/core test` — 44/44 files, 249/249 tests pass (6 real `pack-integrity` assertions replacing the 1 placeholder).
- [x] `pnpm -r build` — all 10 packages build successfully.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] `docs/architecture/CORE-01-OBLIGATIONS.json`/spec-anchor checks remain clean (no rule content touched by this task).

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed (NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes (N/A — test infra only)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (not applicable — no pack logic touched)
- [ ] `pnpm lint` — no dedicated lint script; `tsc` build is the enforced gate
- [x] `pnpm test` passes across affected packages
- [x] Determinism verified — N/A, no runtime logic changed
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Confirmed `packages/game/test/**`'s final 11-file suite is genuinely pack-agnostic — the kernel test suite no longer depends on any concrete ruleset, closing out DD-0366 Decision 5. (The bulk of this decontamination — relocating ~43 broken-import test files, copying synthetic-pack helpers, adding the `no-core-package-imports.test.ts` guardrail — was completed reactively during Task 0373, out of necessity to keep the build green at every step; this task verifies and polishes rather than repeats that work.)
- Found and fixed a real coverage gap: `tripwire-controller-grants-policy.test.ts`'s package sanity-check list didn't include `'core'`, even though its scanner already covered `packages/core/src` correctly — a silent-regression risk if core's scanning ever broke. Fixed by adding `'core'` to `REQUIRED_PACKAGES`.
- Replaced `packages/core/test/pack-integrity.test.ts`'s placeholder with real assertions covering `CorePack`'s full shape: id/manifest, all 6 CORE-01 moves, setup hooks, non-empty atom registration, and the complete root-pack contract (`setupGame`/`turn`/`endIf`/`playerView`/`enumerateIntents`/`updateStats`/`wrapMovesForReplay`) — this is now a meaningful regression guard for the pack's public contract, not just "the module loads."

## 12) Commands Run

- `pnpm -C packages/game test` → ok (11 files, 23 tests)
- `pnpm -C packages/core test` → ok (44 files, 249 tests)
- `pnpm -r build` → ok (all 10 packages)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
