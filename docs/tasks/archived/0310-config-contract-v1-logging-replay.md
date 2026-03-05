# Task 0310 — Config Contract v1 (`logging/replay`) decision consolidation

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0310-config-contract-v1-logging-replay`

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

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (documentation/config-contract scope only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Add a Decision Document that captures rationale for the v1 replay configuration contract.
* Record naming rationale for `logging.replay`.
* Record NDJSON rationale for replay v1.
* Record directory configurability and security boundary guidance.
* Record canonical override precedence (`CLI > ENV > conf.json > Default`).

## 3) Non-Goals

* No runtime code or parser implementation changes.
* No gameplay, engine, or UI behavior changes.

## 4) Inputs

* `docs/logging-config-v1.md`
* Existing DD chain: `DD-0306` to `DD-0309`
* `docs/changelog.md`

## 5) Outputs

### 5.1 Code

* N/A (documentation-only scope)

### 5.2 Tests

* N/A (documentation-only scope)

### 5.3 Docs

* [x] `docs/design-decisions/DD-0310-config-contract-v1-logging-replay.md` created.
* [x] `docs/changelog.md` updated with “Config Contract v1 (logging/replay) eingeführt”.

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

* Added DD-0310 to consolidate rationale for `logging.replay`, NDJSON v1, replay directory safety boundaries, and source precedence.
* Added changelog entry stating “Config Contract v1 (logging/replay) eingeführt”.
* Added task artifact with explicit `affected_guardrails: NONE` and completed PR checklist.

## 12) Commands Run

* `pnpm lint` → ok
* `pnpm test` → ok

