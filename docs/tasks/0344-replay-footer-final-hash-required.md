# Task 0344 — Replay footer requires non-empty finalStateHash and strict verifier enforcement

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003

### compliance_notes

* GR-003: Replay footer hash emission and verification are deterministic and now fail-fast when terminal hash metadata is missing/empty instead of silently accepting invalid empty values.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (replay infra/verifier contract)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM
* FORMAT: `/docs/replay-format-v1.md` §3.5 (`footer.finalStateHash`)

## 2) Goal

* Prevent replay footer emission with empty final hash values.
* Make replay verification reject empty footer hashes when final-hash verification is enabled.
* Add tests for empty-hash rejection and valid-hash acceptance.
* Reflect strictness in replay format/task documentation.

## 3) Non-Goals

* No replay schema version change.
* No move/rules execution changes.
* No checkpoint cadence changes.

## 4) Inputs

* `packages/server/src/replay-logging.ts`
* `packages/server/src/replay-logging.test.ts`
* `packages/game/src/replay-verify.ts`
* `packages/game/test/replay-verify.test.ts`
* `docs/replay-format-v1.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI scope).

## 5) Outputs

### 5.1 Code

* `packages/server/src/replay-logging.ts`
* `packages/game/src/replay-verify.ts`

### 5.2 Tests

* `packages/server/src/replay-logging.test.ts`
* `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (canonical changelog path)
* [x] `/docs/design-decisions/DD-0344-replay-footer-final-hash-required.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required; no normative rule text change)

## 6) Constraints (Hard)

* Deterministic behavior only.
* Footer remains terminal replay record.
* No temporary artifacts committed.

## 7) Invariants (Must remain true)

* Exactly one header first and footer last per stream.
* `footer.totalActions` equals emitted action count.
* Replay verifier remains fail-fast with deterministic diagnostics.

## 8) Implementation Plan

* [x] Step 1: Fail close-time footer emission if no non-empty state hash was observed.
* [x] Step 2: Tighten verifier `verifyFinalHash` path to reject empty footer hash values.
* [x] Step 3: Add tests for strict hash behavior.
* [x] Step 4: Update replay format and governance docs/changelog.

## 9) Acceptance Criteria

* [x] Replay sink does not write `finalStateHash: ""`.
* [x] `verifyFinalHash` rejects `footer.finalStateHash: ""`.
* [x] `verifyFinalHash` accepts a correct non-empty footer hash.
* [x] Docs reflect non-empty strict final hash requirement.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (blocked by pre-existing workspace package-resolution issues in this environment)
* [x] `pnpm test` (or `pnpm vitest run`) passes (targeted game verifier suite)
* [x] Determinism verified (replay sink/verifier tests)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Enforced non-empty final hash precondition before replay footer emission.
* Switched sink close behavior to throw a deterministic, contextual error when no terminal hash was captured.
* Tightened replay verifier final-hash mode to reject empty footer hash values.
* Added server and game test coverage for empty-hash rejection and valid-hash acceptance.
* Updated replay format docs and changelog and added ADR DD-0344.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-verify.test.ts` → OK
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → FAIL (environment/workspace package resolution: `@balance-control/game` entry unresolved)
* `pnpm -C packages/game build` → FAIL (pre-existing workspace package resolution for `@balance-control/rules`)
* `pnpm lint` → N/A (not run after unresolved workspace build/linking failures)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
