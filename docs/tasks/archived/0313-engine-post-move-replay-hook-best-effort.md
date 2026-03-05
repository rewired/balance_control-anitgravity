# Task 0313 — Engine: einzelner Post-Move-Logging-Hook (best-effort)

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0313-engine-post-move-replay-hook-best-effort`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-003 respected by using deterministic monotone `seq` in a single in-memory hook path and optional canonical `hashState` calculation only after successful move execution.

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

* CORE: N/A (infrastructure hook; no rule-resolution change)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Add one canonical post-move hook in engine/game path that writes only successfully executed actions.
* Emit monotone `seq`.
* Support optional `stateHash` per action.
* Keep engine filesystem-free via interface abstraction (`ReplaySink`).
* Ensure logging failures are best-effort and cannot change gameplay state.

## 3) Non-Goals

* No gameplay/rule changes.
* No direct filesystem writer implementation in `packages/game`.
* No replay parser/reader changes.

## 4) Inputs

* `packages/game/src/index.ts`
* `packages/game/src/engine/`
* `docs/replay-format-v1.md`
* `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope)

## 5) Outputs

### 5.1 Code

* [x] `packages/game/src/engine/replay-sink.ts` added.
* [x] `packages/game/src/index.ts` updated to apply replay hook at move assembly boundary.
* [x] `packages/game/test/replay-sink.test.ts` added.

### 5.2 Tests

* [x] Unit tests for successful-only logging, monotone sequence behavior, and best-effort error-channel behavior.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0313-engine-post-move-replay-hook-best-effort.md` created (ADR traceability requirement)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism must remain intact.
* Engine must remain filesystem-free.
* Hook must emit only executed actions (exclude `INVALID_MOVE`).

## 7) Invariants (Must remain true)

* Move legality and mutation semantics remain engine-owned and unchanged.
* Logging errors must not alter resulting game state.
* No expansion leakage or new state fields introduced.

## 8) Implementation Plan

* [x] Add replay sink interface/types and post-success wrapper helper.
* [x] Wire wrapper into game factory so stage/root move maps share one hook.
* [x] Add unit tests for logging filtering, `seq`, and error channel.
* [x] Add DD + changelog entries.
* [x] Run lint/tests and record outcomes.

## 9) Acceptance Criteria

* [x] Only successful actions are logged.
* [x] `seq` is monotone.
* [x] Optional `stateHash` support is present.
* [x] Output is interface-based (`ReplaySink`), no filesystem code in engine.
* [x] Sink failures are caught and routed to error channel without state mutation side effects.

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

* Added `ReplaySink` infrastructure interface and action record contract for post-success move logging.
* Implemented `withReplaySink` move wrapper that logs only non-`INVALID_MOVE` executions.
* Added monotone in-memory `seq` and optional `stateHash` support.
* Added best-effort sink error handling routed through dedicated error channel.
* Integrated wrapper into game factory so root and stage moves share one sequence stream.
* Added unit tests for success filtering, sequence behavior, and sink error handling.
* Added DD-0313 and changelog update.

## 12) Commands Run

* `pnpm lint` → ok
* `pnpm test` → ok
* Frontend QA runbook → N/A (no UI changes)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same Postflight block.
