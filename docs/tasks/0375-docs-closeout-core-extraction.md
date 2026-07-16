# Task 0375 — Docs Closeout: CORE Extraction Task Chain

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

- NONE (documentation-only task; no code changed)

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

- CORE: N/A (documentation/housekeeping only)
- ARCH: DD-0366 (referenced, not modified further)

## 2) Goal

- Add the single canonical changelog entry (`/docs/changelog.md`) summarizing task chain 0366–0374, per AGENTS.md §6.1 (mandatory documentation update for state/resolver/architecture changes).
- Close out the stale `docs/tasks/archived/0098-expansions-first-class-packs.md` (FROZEN since 2026-02-17) with an append-only amendment pointing to this chain as its actual completion, per AGENTS.md's amendment discipline (Sections 0–9 frozen, append-only after freezing).
- Verify the whole chain one final time end-to-end.

## 3) Non-Goals

- Does not move any of the 0366–0374 task files into `docs/tasks/archived/` — per repo convention (confirmed via `docs/tasks/` inspection at the start of this work), recently-completed tasks are left in `docs/tasks/` unarchived for a period before a later batch-archival pass; this task does not change that convention.
- Does not fix the residual, explicitly-deferred items already documented in DD-0366 (Decision 3: `'core'`-special-casing in `expansion-registry.ts`'s expansion-only iteration paths) or DD-0366's correction note (Decision 4: `EnginePackId`'s closed union) — those remain out of scope by design.

## 4) Inputs

- `docs/changelog.md` (existing format/convention)
- `docs/tasks/archived/0098-expansions-first-class-packs.md` (stale precursor, FROZEN)
- Tasks 0366–0374 (this chain's own task files, for the summary)

## 5) Outputs

### 5.1 Code

- None (documentation-only task)

### 5.2 Tests

- None (final verification re-run only, no new tests)

### 5.3 Docs

- `docs/changelog.md` — one new entry summarizing the 0366–0374 chain
- `docs/tasks/archived/0098-expansions-first-class-packs.md` — Amendment A-01 appended, pointing to this chain as the actual completion

## 6) Constraints (Hard)

- No rewriting of Sections 0–9 of the archived task 0098 file (append-only amendment only, per its own state-machine rules).
- Only the canonical `/docs/changelog.md` path used (no `CHANGELOG.md` or alternate-case variants).

## 7) Invariants (Must remain true)

- N/A — no runtime behavior in this task.

## 8) Implementation Plan

- [x] Step 1: Write the changelog entry for the 0366–0374 chain.
- [x] Step 2: Append Amendment A-01 to `docs/tasks/archived/0098-expansions-first-class-packs.md`.
- [x] Step 3: Run `pnpm run verify:docs` (changelog path/location housekeeping check).
- [x] Step 4: Final full-chain verification: full workspace build, all 7 testable packages, full `audit:spec` gate.

## 9) Acceptance Criteria

- [x] `pnpm run verify:docs` passes.
- [x] `pnpm -r build` — all 10 packages build successfully.
- [x] `pnpm -C packages/game test` — 11/11 files, 23/23 tests.
- [x] `pnpm -C packages/core test` — 44/44 files, 249/249 tests.
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11 (no regeneration), cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm -C packages/bot-llm test` — 3/3 files, 17/17 tests.
- [x] `pnpm -C packages/client-web test` — 50/50 files, 284/284 tests.
- [x] `pnpm -C packages/server test` — 2/2 files, 3/3 tests.
- [x] `pnpm run audit:spec` passes end-to-end.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed (NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes (N/A — docs only)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (not applicable — no code touched)
- [ ] `pnpm lint` — N/A, no code changed
- [x] `pnpm test` — full suite re-verified green across all packages
- [x] Determinism verified — golden replay unchanged
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated (this task's primary output)
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Added the canonical changelog entry summarizing the entire task(0366–0374) CORE extraction chain: what changed (CORE-01 moved into `@balance-control/core`, kernel is now ruleset-agnostic, new root-pack contract), and a pointer to DD-0366 for full rationale.
- Closed out `docs/tasks/archived/0098-expansions-first-class-packs.md` with an append-only Amendment A-01, marking it superseded by this chain rather than leaving it as a dangling FROZEN draft with no resolution.
- Re-ran the full verification suite one final time across all 10 packages to confirm the entire 9-stage chain lands in a fully green, self-consistent state.

## 12) Commands Run

- `pnpm run verify:docs` → ok
- `pnpm -r build` → ok (all 10 packages)
- `pnpm -C packages/game test` → ok (11 files, 23 tests)
- `pnpm -C packages/core test` → ok (44 files, 249 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests)
- `pnpm -C packages/bot-llm test` → ok (3 files, 17 tests)
- `pnpm -C packages/client-web test` → ok (50 files, 284 tests)
- `pnpm -C packages/server test` → ok (2 files, 3 tests)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
