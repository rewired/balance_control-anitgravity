# Task 0364 — Client-web hotseat replay forwarding test

**Date:** 2026-03-10  
**Owner:** Codex  
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`  
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002
* GR-003

### compliance_notes

* GR-002: legality/execution remains in engine `withReplaySink`; client-web test only observes replay forwarding transport output.
* GR-003: test fixtures use deterministic `_stateID` progression and assert deterministic replay record categories without introducing non-deterministic behavior.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] Applied `SEC > DD > TDD > AGENTS > VISION`.
* [x] Class presence/absence documented: SEC present, DD present, TDD present, AGENTS present, VISION absent.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-01:CLIENT_RESTRICTIONS
* ARCH-01:DETERMINISM

---

## 2) Goal

* Add a `packages/client-web/test/` test that executes a legal hotseat move and verifies replay forwarding (`sendBeacon` and `fetch`) includes expected replay records.

---

## 3) Non-Goals

* No gameplay logic changes.
* No replay schema changes.
* No UI rendering/style changes.

---

## 4) Inputs

* `packages/client-web/src/game.ts`
* `packages/client-web/src/replay/hotseat-forwarding-sink.ts`
* `packages/game/src/engine/replay-sink.ts`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/test/hotseat-replay-forwarding.test.ts`

### 5.2 Docs

* [x] `/docs/changelog.md` updated
* [x] task file updated in `/docs/tasks/`
* [x] DD updated/added (`/docs/design-decisions/DD-0364-hotseat-replay-forwarding-test.md`)

---

## 6) Constraints (Hard)

* Test must execute a legal hotseat move path and not synthetic illegal rejection path.
* Test must mock forwarding channel and collect forwarded replay records.
* Test must assert at least one `action` and at least one `checkpoint.turnEnd` record.

---

## 7) Invariants

* Replay emission stays engine-owned via `withReplaySink`.
* Transport forwarding uses `sendBeacon` primary and `fetch` fallback.
* Footer assertion is conditional: if footer exists then `totalActions > 0`.

---

## 8) Implementation Plan

* [x] Add new client-web test near existing hotseat tests.
* [x] Use `HotseatForwardingReplaySink` and engine `withReplaySink` with deterministic legal move fixture.
* [x] Mock `navigator.sendBeacon` and `fetch` and collect transmitted records.
* [x] Assert required replay record types and conditional footer assertion.
* [x] Update changelog and add DD.

---

## 9) Acceptance Criteria

* [x] At least one forwarded `recordType: "action"` asserted.
* [x] At least one forwarded `checkpoint.turnEnd` asserted.
* [x] If footer appears in forwarded stream, `footer.totalActions > 0` asserted.
* [x] New test passes in `packages/client-web` Vitest run.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed/compliance documented
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved
* [ ] `pnpm lint` passes (N/A scoped task)
* [x] `pnpm test` passes (scoped)
* [x] Determinism preserved
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated

---

## 11) Work Summary

* Added `hotseat-replay-forwarding.test.ts` under `packages/client-web/test`.
* Anchored test to `createClientGameWithReplayHooks`, `HotseatForwardingReplaySink`, and `withReplaySink`.
* Added deterministic legal-move fixture context (`_isPlayerView`, `_stateID` progression) to emit replay records.
* Mocked sendBeacon and fetch forwarding paths; asserted required replay record types from collected forwarded JSON records.
* Added DD-0364 and changelog entry.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web exec vitest run test/hotseat-replay-forwarding.test.ts` → pass

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/client-web exec vitest run test/hotseat-replay-forwarding.test.ts`
* `git show -1 --stat`

---

## 15) Amendments (append-only)

* N/A
