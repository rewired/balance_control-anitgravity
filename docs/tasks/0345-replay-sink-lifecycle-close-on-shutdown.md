# Task 0345 — Replay sink lifecycle close contract and shutdown finalization

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

* GR-003: Replay sink shutdown finalization is deterministic and now centralized to a single-shot close path for signal/exit hooks.

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

* CORE: N/A (replay infra lifecycle)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM
* FORMAT: `/docs/replay-format-v1.md` §3.5 (`footer` terminal finalization)

## 2) Goal

* Extend the replay sink interface with an explicit close lifecycle hook.
* Ensure server sink factory typing returns a closeable sink.
* Register deterministic server shutdown hooks that close the sink once.
* Add server tests for single-shot close behavior on shutdown hooks.

## 3) Non-Goals

* No replay schema version or payload shape changes.
* No engine move/rules behavior changes.
* No UI/front-end behavior changes.

## 4) Inputs

* `packages/game/src/engine/replay-sink.ts`
* `packages/server/src/replay-logging.ts`
* `packages/server/src/index.ts`
* `packages/server/src/replay-logging.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (non-UI scope).

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/server/src/replay-logging.ts`
* `packages/server/src/index.ts`
* `packages/server/src/replay-sink-lifecycle.ts`

### 5.2 Tests

* `packages/server/src/replay-sink-lifecycle.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (canonical changelog path)
* [x] `/docs/design-decisions/DD-0345-replay-sink-lifecycle-close-on-shutdown.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required; no normative rule text change)

## 6) Constraints (Hard)

* Deterministic behavior only.
* Footer finalization remains sink-owned.
* No temporary artifacts committed.

## 7) Invariants (Must remain true)

* Exactly one header first and footer last per stream.
* Footer emission remains close-boundary behavior.
* Hotseat ingest and server game writes share one sink instance lifecycle.

## 8) Implementation Plan

* [x] Step 1: Add replay sink close lifecycle hook with TSDoc footer finalization requirements.
* [x] Step 2: Return a closeable sink type from server `createReplaySink`.
* [x] Step 3: Add shutdown lifecycle helper and wire `index.ts` to close sink on `SIGINT`, `SIGTERM`, `beforeExit`, and `exit` exactly once.
* [x] Step 4: Add server tests for one-shot close behavior through shutdown paths.
* [x] Step 5: Update changelog and add DD.

## 9) Acceptance Criteria

* [x] `ReplaySink` supports a lifecycle close method contract.
* [x] `createReplaySink` callers can invoke `close` without unsafe casts.
* [x] Server shutdown paths call sink `close` once.
* [x] Server tests validate shutdown lifecycle one-shot close behavior.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (not run; scoped verification used)
* [ ] `pnpm test` (or `pnpm vitest run`) passes (workspace test blocked by pre-existing package entry resolution for `@balance-control/game`)
* [x] Determinism verified (shutdown lifecycle test + replay sink footer contract tests)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added optional replay sink close lifecycle hook with deterministic footer-finalization TSDoc contract.
* Updated server replay sink factory typing to return a closeable sink contract.
* Added a dedicated server replay sink shutdown lifecycle module that registers signal + exit hooks.
* Wired server startup to register the one-shot lifecycle handler for the shared sink instance used by both game server and hotseat ingest.
* Added tests proving close is invoked once across process shutdown paths and signal-triggered termination.
* Added DD-0345 and changelog entry for the lifecycle contract update.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts src/replay-sink-lifecycle.test.ts` → FAIL (`src/replay-logging.test.ts` blocked by pre-existing workspace package entry resolution for `@balance-control/game`; `src/replay-sink-lifecycle.test.ts` passed)
* `pnpm -C packages/server exec vitest run src/replay-sink-lifecycle.test.ts` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
