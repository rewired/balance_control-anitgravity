# Task 0315 — Replay CLI: strikt sequentieller Verifier für schnelle Bug-Reproduktion

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003 respected: verifier replays deterministic move inputs against seeded setup and validates first divergence deterministically.
* GR-012 respected: match setup is sourced from replay `header.matchConfig` as single authoritative config for that replay execution.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): present/present/present/present/absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (infrastructure replay-verification tooling)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Implement a CLI/script for quick deterministic bug-ticket reproduction using Replay-v1 NDJSON.
* Read `header` and initialize match with identical seed/config.
* Execute `action` records strictly in sequence.
* Optionally verify `checkpoint` and `footer` hashes.
* Abort at first divergence with `seq` and diagnosis.

## 3) Non-Goals

* No gameplay rule changes.
* No UI changes.
* No deep forensic analyzer (single-pass fail-fast only).

## 4) Inputs

* `docs/replay-format-v1.md`
* `packages/game/src/replay.ts`
* `packages/game/src/hash-state.ts`
* `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope)

## 5) Outputs

### 5.1 Code

* [x] Replay verifier utility for Replay-v1 NDJSON records.
* [x] CLI entrypoint that reads NDJSON file + optional verification flags.
* [x] Root script for running verifier quickly from repository root.

### 5.2 Tests

* [x] `pnpm -C packages/game test -- replay-verify.test.ts`
* [x] `pnpm lint`
* [x] `pnpm test`

### 5.3 Docs

* [x] `/docs/replay-format-v1.md` updated with CLI verification workflow.
* [x] `/docs/changelog.md` updated.
* [x] `/docs/design-decisions/DD-0315-replay-cli-strict-sequential-verifier.md` created.
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism unchanged.
* Verifier must be fail-fast at first mismatch.
* Match initialization must come from replay header.

## 7) Invariants (Must remain true)

* Engine rule authority remains in `packages/game`.
* Replay verification must not mutate external state.
* No temporary artifacts committed.

## 8) Implementation Plan

* [x] Add Replay-v1 record verifier with strict `seq` validation.
* [x] Add CLI with optional checkpoint/final hash verification flags.
* [x] Add targeted test coverage for success + first-divergence behavior.
* [x] Add ADR + changelog + task artifact updates.
* [x] Run lint/test.

## 9) Acceptance Criteria

* [x] Header is consumed to seed and configure replay setup.
* [x] Actions execute strictly with contiguous seq validation.
* [x] Optional checkpoint and final hash checks are supported.
* [x] First divergence exits with seq + diagnostic reason.

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
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary

* Added `verifyReplayRecords` for Replay-v1 NDJSON with seeded header setup and strict action-seq enforcement.
* Added fail-fast divergence diagnostics containing sequence number and mismatch reason.
* Added optional checkpoint/final hash verification controls in the verifier.
* Added CLI entrypoint and root convenience command `pnpm replay:verify`.
* Added unit tests for deterministic success path and first-divergence handling.
* Added DD-0315 and changelog entry.

## 12) Commands Run

* `pnpm -C packages/game test -- replay-verify.test.ts` → ok
* `pnpm replay:verify -- /tmp/replay-sample.ndjson` → ok
* `pnpm lint` → ok
* `pnpm test` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same Postflight block.

## 15) Amendments (append-only)

