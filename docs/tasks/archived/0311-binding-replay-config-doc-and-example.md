# Task 0311 — Verbindliches Replay-Konfigdokument + `conf.example.json`

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0311-binding-replay-config-doc`

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

* CORE: N/A (documentation/config-contract scope only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Provide a verbindlicher, compact v1 contract for `logging.replay` in one normative section.
* Capture mandatory/optional fields and deterministic override precedence.
* Document canonical ENV key mapping including `BC_LOGGING__REPLAY__DIRECTORY`.
* Define fail-fast error behavior for invalid known values.
* Add a copy-ready `conf.example.json` for local startup.

## 3) Non-Goals

* No runtime parser or loader implementation changes.
* No gameplay, engine, or UI behavior changes.

## 4) Inputs

* `docs/logging-config-v1.md`
* `docs/design-decisions/DD-0310-config-contract-v1-logging-replay.md`
* `docs/changelog.md`

## 5) Outputs

### 5.1 Code

* N/A (documentation + example config only)

### 5.2 Tests

* N/A (documentation scope)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0311-binding-replay-config-doc-and-example.md` created (ADR traceability)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Documentation changes must remain consistent with existing v1 config decisions.
* Keep deterministic precedence wording unchanged: `CLI > ENV > conf.json > Defaults`.

## 7) Invariants (Must remain true)

* No runtime semantics changed.
* No additional changelog path introduced.
* `logging.replay.format` remains constrained to `ndjson` in v1.

## 8) Implementation Plan

* [x] Add a normative minimal contract section in `docs/logging-config-v1.md` covering required fields, optional fields, precedence, ENV mapping, and fail-fast errors.
* [x] Add `conf.example.json` in repo root for local startup.
* [x] Add ADR/DD file and changelog entry.
* [x] Run lint/tests and record commands.

## 9) Acceptance Criteria

* [x] Contract explicitly includes: root `configVersion`, namespace `logging.replay`, fields (`enabled`, `directory`, `format=ndjson`, `includeStateHash`, `flushEveryEvents`).
* [x] Contract states canonical override order: `CLI > ENV > conf.json > Defaults`.
* [x] Contract includes ENV mapping examples including `BC_LOGGING__REPLAY__DIRECTORY`.
* [x] Contract defines fail-fast invalid-value behavior with clear messages.
* [x] `conf.example.json` exists and is directly usable.

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

* Added a normative minimal contract section to `docs/logging-config-v1.md` for `logging.replay`.
* Explicitly documented required vs optional fields, defaults, precedence, and fail-fast examples.
* Added `conf.example.json` with a copy-ready local baseline.
* Added DD-0311 for ADR traceability.
* Updated `docs/changelog.md` with task(0311) entry.

## 12) Commands Run

* `pnpm lint` → ok
* `pnpm test` → ok
* Frontend QA runbook → N/A (no UI change)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same Postflight block.
