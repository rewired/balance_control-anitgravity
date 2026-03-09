# Task 0347 — Fix server replay test typing for `lastStateHash`

**Date:** 2026-03-09
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0346-fix-server-replay-footer-test-regressions`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes

* NONE: Change is limited to TypeScript test harness typing in `packages/server` and does not alter engine/client rule execution.

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

* CORE: N/A (server test typing only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: N/A
* FORMAT: `/docs/replay-format-v1.md` footer hash flow context only (no behavior changes)

## 2) Goal

* Fix the `pnpm -w build` regression caused by test-side structural typing mismatch for stream state helper methods.

## 3) Non-Goals

* No replay sink runtime behavior changes.
* No game rule/state changes.
* No client UI changes.

## 4) Inputs

* Repo areas:
  * `packages/server/src/replay-logging.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI scope).

## 5) Outputs

### 5.1 Code

* `packages/server/src/replay-logging.test.ts`

### 5.2 Tests

* Build/typecheck commands only.

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0347-server-replay-test-streamstate-typing.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required)

## 6) Constraints (Hard)

* Keep replay footer contract unchanged.
* Keep deterministic replay behavior unchanged.

## 7) Invariants (Must remain true)

* `NdjsonReplaySink.close()` still requires non-empty final hash before footer emission.
* Replay boundary record ordering remains unchanged.

## 8) Implementation Plan

* [x] Step 1: Reproduce build failure and identify failing type location.
* [x] Step 2: Align local test helper stream-state structural type with runtime stream state shape by adding optional `lastStateHash`.
* [x] Step 3: Re-run build checks.
* [x] Step 4: Update docs/task artifacts.

## 9) Acceptance Criteria

* [x] `packages/server` build passes.
* [x] Workspace build progresses past prior server failure point.
* [x] No replay runtime logic changed.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes (N/A this task)
* [x] `pnpm test` (or `pnpm vitest run`) passes (N/A this task)
* [x] Determinism verified (N/A runtime unchanged)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Reproduced workspace build and confirmed prior failure moved from server runtime logic to test type mismatch.
* Identified `ReplaySinkLike` structural augmentation omitted `lastStateHash` while test sets `streamState.lastStateHash`.
* Added optional `lastStateHash` to local helper types for `ensureStream`, `captureHeaderMetadata`, and `ensureHeader` signatures.
* Confirmed `packages/server` build now passes.
* Confirmed workspace build no longer fails in `packages/server`; current failure is in `packages/client-web` unrelated to this server fix.

## 12) Commands Run (with outcomes)

* `pnpm -w build` → FAIL (initially at `packages/server` before fix; then after fix fails later in `packages/client-web` due to unrelated `metaIconsBySeat` typing)
* `pnpm -C packages/server build` → OK
* `git status -sb` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
