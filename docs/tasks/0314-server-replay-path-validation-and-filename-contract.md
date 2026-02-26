# Task 0314 — Server replay path validation and filename contract

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-003 respected: replay naming/path handling runs in server infrastructure only; no gameplay mutation semantics changed.

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

* CORE: N/A (server infrastructure pathing/logging)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Set runtime default replay output path to `./var/replays` (configurable via environment override).
* Implement replay filename contract containing matchId/seed/timestamp.
* Ensure replay directory exists automatically at server startup.
* Add robust replay path validation with clear no-traversal error messages.

## 3) Non-Goals

* No gameplay rule/resolver changes.
* No UI/frontend behavior changes.
* No replay-parser contract changes.

## 4) Inputs

* `packages/game/src/engine/replay-sink.ts`
* `packages/server/src/boot.ts`
* `docs/logging-config-v1.md`
* `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/prozess scope)

## 5) Outputs

### 5.1 Code

* [x] Replay file sink implementation in server package.
* [x] Server boot wiring updated to use replay sink + default/configurable replay path.
* [x] Replay action metadata includes optional `matchId`/`seed` fields for filename construction.

### 5.2 Tests

* [x] `pnpm lint`
* [x] `pnpm test`

### 5.3 Docs

* [x] `/docs/logging-config-v1.md` updated.
* [x] `/docs/design-decisions/DD-0314-server-replay-path-validation-and-filename-contract.md` created.
* [x] `/docs/changelog.md` updated.
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism unchanged in engine outcomes.
* No path traversal acceptance in relative replay directory config.
* Engine stays filesystem-free.

## 7) Invariants (Must remain true)

* Replay logging failures must not alter move legality/state mutation.
* Replay infrastructure remains outside core rules engine logic.
* Workspace docs and task artifacts remain canonical under `docs/`.

## 8) Implementation Plan

* [x] Add server-side replay sink with file naming convention and directory creation.
* [x] Add replay directory resolver with validation and clear error text.
* [x] Wire server game creation to replay hook sink.
* [x] Update docs + ADR + changelog.
* [x] Run lint/test.

## 9) Acceptance Criteria

* [x] Default replay path resolves to `./var/replays`.
* [x] Path override remains configurable.
* [x] Relative traversal (`..`) is rejected with clear error.
* [x] Replay filename includes `matchId`, `seed`, and timestamp.
* [x] Replay directory is created at startup if missing.

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

* Added server-side NDJSON replay sink implementation and startup directory creation.
* Wired server game creation to replay hook infrastructure with optional state hash.
* Extended replay action metadata to include optional `matchId` and `seed` for file naming.
* Added robust replay path resolver with explicit traversal/null-byte/empty-path validation errors.
* Updated logging configuration docs, changelog, and added DD-0314.

## 12) Commands Run

* `pnpm lint` → ok
* `pnpm test` → ok

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same Postflight block.

## 15) Amendments (append-only)

