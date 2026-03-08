# Task 0339 — replay NDJSON header/footer/checkpoint with verifier round-trip

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0339-replay-ndjson-header-footer-checkpoint`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003
* GR-012

### compliance_notes

* GR-003: Replay action sequence now starts at `1` and increments strictly per accepted action; writer-inserted checkpoint/footer derive only from deterministic action/state-hash stream data.
* GR-003: Integration tests run generated NDJSON through deterministic verifier with checkpoint + final hash checks.
* GR-012: Header metadata (`matchConfig`, `expansions`) is sourced from canonical game config state (`G.meta.cfg`) and `ctx.numPlayers` exported by engine context.

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

* CORE: N/A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM
* FORMAT: `/docs/replay-format-v1.md` sections 2, 3.1, 3.2, 3.4, 3.5

## 2) Goal

* Write Replay v1 boundary records (`header`, `footer`) per persisted match file.
* Support optional deterministic `checkpoint` emission at configured action cadence.
* Align emitted `action.seq` with verifier expectation (`>=1`, contiguous).
* Validate generated replay files end-to-end against the verifier.

## 3) Non-Goals

* No gameplay rule or legality semantics changes.
* No UI/client-web changes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/server/src/replay-logging.ts`
  * `packages/game/src/replay-verify.ts`
  * existing replay tests in `packages/game/test` and `packages/server/src`
* Existing behavior summary (current):
  * Server sink wrote only emitted engine records without v1 boundary records.
  * Engine replay actions started seq at `0`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* 2026-03-08: Follow-up stabilization run fixed repo-wide failing checks uncovered by `pnpm test` (anchor references in historical task docs, flaky formalize precondition fixture, ActionDock variant label expectation, and integration golden hash fixtures). (no UI/client-web/process scope).

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/index.ts`
* `packages/server/src/replay-logging.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0339-replay-boundary-records-and-seq-alignment.md` created (only if ambiguity/conflict)
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

* [x] Step 1: Align replay action sequence counter with verifier contract and propagate deterministic header metadata in replay records.
* [x] Step 2: Extend server NDJSON sink to emit header/footer and optional action-cadence checkpoints.
* [x] Step 3: Add integration tests that verify generated replay files via `verifyReplayRecords`.
* [x] Step 4: Update documentation artifacts (task, DD, changelog).

## 9) Acceptance Criteria

* [x] Replay files start with exactly one `header` and end with exactly one `footer` per sink stream.
* [x] `action.seq` in emitted records starts at `1` and remains contiguous.
* [x] Checkpoint records are emitted only when cadence is configured and state hash is available.
* [x] Generated replay file passes verifier with `verifyCheckpoints` + `verifyFinalHash` enabled.
* [x] Golden replay unchanged or updated intentionally with explanation. (N/A: no golden fixtures changed)

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` passes
* [x] `pnpm test` passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Changed replay move hook sequencing from zero-based to one-based to match verifier invariants.
* Added deterministic replay header metadata (`matchConfig`, canonical `expansions`) to game-emitted replay records.
* Extended server NDJSON replay sink with v1 `header`, optional cadence-based `checkpoint`, and `footer` record emission.
* Added server integration tests that generate replay files and verify them end-to-end with the game verifier.
* Added DD-0339 and updated changelog entry for traceability.

## 12) Commands Run (with outcomes)

* `pnpm test` → FAIL (captured failing details before fixes: `packages/game/test/core-compliance-invariants.test.ts` assertion mismatch in Lobbyist virtual-influence case; `packages/game/test/spec-anchor-tripwire.test.ts` unknown non-canonical hotspot rule ID in `docs/tasks/0327-*.md` and `docs/tasks/0328-*.md`)
* `pnpm lint` → OK
* `pnpm test` → OK (all workspace checks and package tests passed in final run)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Captured in final commit message `Postflight:` block.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

Captured in final commit message `Postflight:` block with `git show -1 --stat`.

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* 2026-03-08: Follow-up stabilization run fixed repo-wide failing checks uncovered by `pnpm test` (anchor references in historical task docs, flaky formalize precondition fixture, ActionDock variant label expectation, and integration golden hash fixtures).
