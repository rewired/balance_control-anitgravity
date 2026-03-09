# Task 0354 — Replay v2 canonical schema

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `task/0354-replay-v2-canonical-schema`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-003
* GR-011
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Replay payloads are derived artifacts and do not persist into authoritative game state.
* GR-003: Replay v2 records are deterministic and hash-based with no wall-clock fields in canonical content.
* GR-011: Round-settlement replay records are emitted post-settlement without modifying production order.
* GR-012: Header metadata is sourced once from canonical match config.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD absent, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A, CORE-01-06-16, CORE-01-07-03D
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION, ARCH-05

## 2) Goal

* Replace replay writer schema with Replay v2 (header+manifest+events+footer).
* Emit deterministic action/system/checkpoint records with stronger audit detail.
* Remove per-event repeated static metadata from persisted body records.

## 3) Non-Goals

* No engine rules behavior changes.
* No dual canonical replay writers.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/src/replay-verify.ts`
  * `packages/server/src/replay-logging.ts`
  * `packages/game/test/*replay*`
  * `packages/server/src/replay-logging.test.ts`
* Existing behavior summary (current): replay v1 with header/action/system.roundSettlement/checkpoint/footer and repeated metadata on body lines.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

N/A (no client-web UI changes).

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/replay-verify.ts`
* `packages/server/src/replay-logging.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`
* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves.
* No implicit rules.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: Map replay v1 producers/consumers and define Replay v2 record contracts.
* [x] Step 2: Implement Replay v2 emission in game replay sink.
* [x] Step 3: Implement Replay v2 persistence boundaries in server sink.
* [x] Step 4: Update verifier and tests for new format/requirements.

## 9) Acceptance Criteria

* [x] Replay output uses header + manifest + events + footer.
* [x] Repeated per-line static metadata removed from persisted event records.
* [x] Choice and checkpoint context is emitted and verifiable.
* [x] Golden replay unchanged or updated intentionally with explanation.

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

* Implemented Replay v2 event record model and manifest emission in game replay sink.
* Added v2 header/footer behavior in server replay writer including totalRecords.
* Updated replay verifier to parse and validate v2 body ordering and choice-open precondition.
* Reworked replay tests around new v2 structure.

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts` → ok (5 tests passed)
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → ok (1 test passed)

### 12.1 Frontend QA command order (required for UI/prozess scope)

N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

N/A

* `pnpm test` → ok (workspace checks + all package tests passed)
