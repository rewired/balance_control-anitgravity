# Task 0346 — Fix server replay footer/hash test regressions

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0346-fix-server-replay-footer-test-regressions`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003

### compliance_notes

* GR-003: Replay sink close-path validation and cleanup are deterministic and do not depend on wall clock/time-based branching.
* GR-003: Tests now provide explicit deterministic `stateHash` where footer emission is expected.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD absent, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (server replay infra)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM
* FORMAT: `/docs/replay-format-v1.md` §3.5 (`footer.finalStateHash` required terminal record)

## 2) Goal

* Restore workspace green test execution by fixing failing server replay tests.
* Keep strict replay footer contract (no empty/missing final hash fallback).
* Remove unhandled async stream errors in negative close-path tests.

## 3) Non-Goals

* No replay schema version changes.
* No game rule execution changes.
* No client-web changes.

## 4) Inputs

* Repo areas:
  * `packages/server/src/replay-logging.ts`
  * `packages/server/src/replay-logging.test.ts`
* Existing behavior summary (current):
  * close-time footer hash validation threw before stream cleanup; some tests expected successful close without stateHash.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI scope).

## 5) Outputs

### 5.1 Code

* `packages/server/src/replay-logging.ts`

### 5.2 Tests

* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0346-replay-sink-close-validation-cleanup.md` created (decision clarification)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required)

## 6) Constraints (Hard)

* Determinism preserved.
* No implicit footer defaults.
* No temporary files committed.

## 7) Invariants (Must remain true)

* Replay header/footer boundaries remain canonical.
* Footer requires non-empty final state hash.
* Server replay output remains JSON-serializable NDJSON.

## 8) Implementation Plan

* [x] Step 1: Reproduce failing workspace tests and isolate server replay failures.
* [x] Step 2: Update replay tests to provide required `stateHash` where close success is expected.
* [x] Step 3: Harden sink close error path to destroy streams before throwing validation errors.
* [x] Step 4: Re-run server and workspace test suites.
* [x] Step 5: Update docs (task + changelog + DD).

## 9) Acceptance Criteria

* [x] `packages/server/src/replay-logging.test.ts` passes without unhandled errors.
* [x] Full `pnpm test` passes in workspace.
* [x] Strict footer hash contract remains enforced by negative tests.

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

## 11) Work Summary (3–7 bullets)

* Reproduced workspace failures and traced them to `packages/server/src/replay-logging.test.ts` close/footers.
* Updated successful replay test fixture action records to carry deterministic `stateHash` so footer emission is valid.
* Fixed expansion metadata test harness by setting `lastStateHash` before closing synthetic stream-state flow.
* Hardened `NdjsonReplaySink.close()` to destroy open streams and clear registry before throwing validation errors.
* Stabilized missing-footer-hash negative test with short async settle wait to prevent teardown race/unhandled `ENOENT`.
* Added changelog and DD documentation for contract-consistent behavior.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → FAIL (initially; missing footer hash on success path + unhandled errors)
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts src/replay-sink-lifecycle.test.ts` → OK
* `pnpm test` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
