# Task 0363 — Replay sink optimistic dedup without hotseat drop

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

* GR-002: replay emission remains engine-owned instrumentation around engine move execution (`withReplaySink`) and does not move legality/cost/rules logic into client/web/server code.
* GR-003: duplicate suppression now keys off deterministic `_stateID` commit progression, preserving one canonical action log entry per successful committed move and stable monotone `seq`.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] Applied `SEC > DD > TDD > AGENTS > VISION`.
* [x] Class presence/absence documented: SEC present, DD present, TDD present, AGENTS present, VISION absent.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-01:DETERMINISM
* ARCH-01:STATE_AUTHORITY
* ARCH-01:CLIENT_RESTRICTIONS

---

## 2) Goal

* Replace blanket `_isPlayerView` replay suppression with deterministic optimistic/duplicate filtering that does not drop the only hotseat move path.
* Keep exactly one `recordType: "action"` per successful committed move with monotone `seq`.
* Verify footer `totalActions` parity against emitted action records.

---

## 3) Non-Goals

* No gameplay rule changes.
* No replay schema format change.
* No UI behavior changes outside replay logging observability.

---

## 4) Inputs

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/client-web/src/hotseat/HotseatShell.tsx`
* `packages/client-web/src/replay/hotseat-forwarding-sink.ts`
* `packages/server/src/boot.ts`
* `packages/server/src/replay-logging.test.ts`

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/server/src/replay-logging.test.ts`

### 5.2 Docs

* [x] `/docs/changelog.md` updated
* [x] task file updated in `/docs/tasks/`
* [x] DD updated/added (`/docs/design-decisions/DD-0363-replay-sink-optimistic-dedup-hotseat.md`)

---

## 6) Constraints (Hard)

* Deterministic-only filtering; no time/randomness checks.
* Preserve one action record per committed success path.
* Hotseat forwarding path must not be silently dropped solely because `_isPlayerView` is true.

---

## 7) Invariants

* Successful committed move emits exactly one `action` record.
* `seq` stays monotone increasing for emitted action records.
* Optimistic/no-commit pass can be skipped if `_stateID` does not advance.
* Duplicate/stale pass can be skipped if `_stateID` is already recorded.
* Footer `totalActions` equals count of persisted `action` records.

---

## 8) Implementation Plan

* [x] Replace blanket `_isPlayerView` guard with `_stateID`-based optimistic/no-commit + duplicate/stale detection in `withReplaySink`.
* [x] Keep replay write path unchanged for committed hotseat + server-authoritative moves.
* [x] Add replay sink tests for `_isPlayerView` committed path and duplicate optimistic suppression.
* [x] Assert footer/action-count parity in server replay logging boundary test.
* [x] Record architecture decision and changelog.

---

## 9) Acceptance Criteria

* [x] Legal `_isPlayerView` move with `_stateID` advance writes an `action` record.
* [x] Duplicate optimistic pass does not create extra `action` records.
* [x] Emitted `seq` remains monotone across successful records.
* [x] Footer `totalActions` parity is covered by tests.

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

* Replaced `_isPlayerView` blanket drop logic in replay sink with deterministic `_stateID`-gated optimistic and duplicate suppression.
* Preserved single committed action emission semantics and monotone `seq` assignment.
* Added tests proving legal player-view moves are recorded and duplicate optimistic passes are suppressed.
* Added server replay sink test assertion that `footer.totalActions` equals actual `action` record count.
* Added DD-0363 and changelog entry.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts` → pass
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts`
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts`
* `git show -1 --stat`

---

## 15) Amendments (append-only)

* N/A
