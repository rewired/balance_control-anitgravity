# Task 0343 — Replay header requires concrete seed and matchConfig metadata

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
* GR-012

### compliance_notes

* GR-003: Replay header metadata checks are deterministic and depend only on captured record fields; no time/random behavior added.
* GR-012: Header seed/config now must come from actual match metadata capture paths; synthetic defaults were removed.

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

* CORE: N/A (server replay logging infrastructure)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION
* FORMAT: `/docs/replay-format-v1.md` §3.1 (header metadata)

## 2) Goal

* Require concrete `seed` and `matchConfig` before replay header emission.
* Remove schema-v1 placeholder defaults from header generation.
* Emit descriptive errors with stream/match context when required metadata is missing.
* Verify metadata capture paths populate required values before header emission.

## 3) Non-Goals

* No replay schema version bump.
* No verifier algorithm changes.
* No changes to filename timestamp or checkpoint cadence behavior.

## 4) Inputs

* Repo areas:
  * `packages/server/src/replay-logging.ts`
  * `packages/server/src/replay-logging.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (server replay logging scope only; no UI/prozess changes).

## 5) Outputs

### 5.1 Code

* `packages/server/src/replay-logging.ts`

### 5.2 Tests

* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (canonical changelog path)
* [x] `/docs/design-decisions/DD-0343-replay-header-required-metadata.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required; no normative rule changes)

## 6) Constraints (Hard)

* Deterministic behavior only.
* Replay record ordering remains unchanged.
* No temporary artifacts committed.

## 7) Invariants (Must remain true)

* Header remains first replay record.
* Footer remains last replay record.
* Replay metadata capture remains first-write-wins for optional expansions.

## 8) Implementation Plan

* [x] Step 1: Harden stream metadata capture initialization in `ensureStream`.
* [x] Step 2: Harden `captureHeaderMetadata` to fill missing seed/config from incoming records.
* [x] Step 3: Enforce required metadata in `ensureHeader` and throw contextual error when absent.
* [x] Step 4: Add tests for success and failure paths.
* [x] Step 5: Update task/doc artifacts.

## 9) Acceptance Criteria

* [x] Header writing fails if `seed` is missing.
* [x] Header writing fails if `matchConfig` is missing.
* [x] Error includes stream key and match identifier context.
* [x] Header writes successfully when real metadata is available before emission.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (replay logging/verifier tests)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added required-metadata enforcement in replay header emission for schema version `1`.
* Removed synthetic fallback defaults (`unknown-seed`, `{ players: 2 }`) from header writing.
* Added stream context (`streamKey`, `matchId`) to emitted metadata-missing error messages.
* Tightened metadata capture/initialization to accept only valid seed/config inputs and to populate before header emission.
* Added regression tests for both success and failure header paths.
* Added changelog and DD updates.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → OK
* `pnpm -C packages/server test` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
