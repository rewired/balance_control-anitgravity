# Task 0312 — Replay-Format v1 mit klaren Record-Typen

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0312-replay-format-v1-record-types`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

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

* CORE: N/A (documentation-only replay contract)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Specify Replay Format v1 with explicit record taxonomy for NDJSON replays.
* Define required fields for `header`, `action`, optional `checkpoint`, and `footer`.
* Document deterministic serialization constraints for stable replay interoperability.
* Bind the logging configuration spec to the new replay-format contract.

## 3) Non-Goals

* No runtime parser/writer implementation changes.
* No engine rule execution, legality, or state-shape changes.
* No UI/client behavior changes.

## 4) Inputs

* `docs/logging-config-v1.md`
* `docs/changelog.md`
* `docs/design-decisions/`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope)

## 5) Outputs

### 5.1 Code

* N/A (documentation-only task)

### 5.2 Tests

* N/A (documentation-only task)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0312-replay-format-v1-record-types-and-deterministic-serialization.md` created (ADR traceability requirement)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism wording must remain aligned with ARCH contracts.
* Replay schema must stay NDJSON v1-compatible.
* No implicit runtime semantics beyond documented contract.

## 7) Invariants (Must remain true)

* Existing `logging.replay` config contract remains intact.
* No rule/gameplay semantics are altered.
* Deterministic replay expectations are strengthened, not relaxed.

## 8) Implementation Plan

* [x] Add a dedicated Replay Format v1 spec doc with normative record types and required fields.
* [x] Add deterministic serialization rules (stable key ordering, no replay-relevant time values).
* [x] Link `docs/logging-config-v1.md` to the new replay format spec.
* [x] Add DD-0312 and changelog entry.
* [x] Run lint/tests and record outcomes.

## 9) Acceptance Criteria

* [x] `header` includes `schemaVersion`, `seed`, `matchConfig`, `expansions`.
* [x] `action` includes `seq`, `player`, `moveType`, `args`, `turn`, `phase`.
* [x] Optional `checkpoint` includes `stateHash`.
* [x] `footer` includes `finalStateHash`, `totalActions`.
* [x] Deterministic serialization rules are explicitly documented.

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

* Added `docs/replay-format-v1.md` as the normative replay record schema for v1.
* Defined clear required fields for `header`, `action`, `checkpoint` (optional MVP), and `footer`.
* Documented deterministic serialization rules including stable key order and exclusion of replay-relevant time values.
* Linked `docs/logging-config-v1.md` to the new replay format contract.
* Added DD-0312 for ADR traceability and updated `docs/changelog.md`.

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
