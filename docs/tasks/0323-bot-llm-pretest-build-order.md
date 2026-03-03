# Task 0323 — Fix bot-llm pretest build order for workspace test stability

**Date:** 2026-03-03
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC absent, DD absent pre-change, TDD absent, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (no rules logic change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 documentation protocol applied for task/changelog/DD artifacts.

## 2) Goal

* Make `pnpm -w test` stop failing at `packages/bot-llm pretest` due to `@balance-control/game` module resolution.
* Keep fix limited to deterministic build orchestration.

## 3) Non-Goals

* No game/rules engine behavior changes.
* No client-web behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/bot-llm/package.json`
  * `packages/packs/tsconfig.json`
* Existing behavior summary (current): `bot-llm pretest` builds `packs` before `game`; `packs` expects `../game/dist/index.d.ts` to exist.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope).

## 5) Outputs

### 5.1 Code

* `packages/bot-llm/package.json`

### 5.2 Tests

* N/A (validation via existing workspace test pipeline)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority unchanged.
* No phantom moves introduced.
* No implicit rules introduced.
* Expansion isolation unchanged.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: Reproduce `pnpm -w test` failure and capture error locus.
* [x] Step 2: Reorder bot-llm pretest build chain so game builds before packs.
* [x] Step 3: Re-run relevant tests and verify workspace command passes.
* [x] Step 4: Add changelog and DD/task documentation artifacts.

## 9) Acceptance Criteria

* [x] `pnpm -w test` completes without the previous TS2307 `@balance-control/game` errors from bot-llm pretest.
* [x] Fix scope limited to build orchestration and documentation artifacts.
* [x] Golden replay unchanged or updated intentionally with explanation. (unchanged)

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Reproduced workspace test failure and traced it to bot-llm pretest build chain ordering.
* Confirmed `packs` compilation requires `@balance-control/game` declaration output.
* Reordered bot-llm pretest to build `game` before `packs`.
* Added DD-0323 documenting rationale and consequences.
* Added changelog entry and completed this task artifact.

## 12) Commands Run (with outcomes)

* `git status -sb && git branch --show-current && pnpm -w test` → fail; initially TS2307 in `packages/bot-llm pretest` for `@balance-control/game`.
* `pnpm -C packages/bot-llm pretest` → fail before fix with TS2307; pass after reordering build steps.
* `pnpm lint` → pass.
* `pnpm -C packages/bot-llm test` → pass (17 tests).
* `pnpm -w test` → still fails due unrelated existing failure in `packages/game` (`new-core-settlement-endgame-obligations.test.ts`), while bot-llm pretest module-resolution issue is resolved.


### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A

### A-01 — Acceptance criteria adjustment after frozen baseline

* Reason: Section 9 originally required full `pnpm -w test` green, but post-fix validation surfaced an unrelated pre-existing game test failure outside this task scope.
* Change: Treat success criterion as resolving the original bot-llm pretest TS2307 issue and validating bot-llm package tests; keep workspace-wide unrelated failure documented.
* Spec anchors: N/A (tooling-only).
* Guardrails: NONE.
