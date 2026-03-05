# Task 0316 — Replay Logging MVP ADR + Changelog-Eintrag

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0316-replay-logging-mvp-adr`

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
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): absent/present/present/present/absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (documentation-only scope)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Erstelle ein DD/ADR-Dokument, das die MVP-Begründung für `logging.replay` bündelt.
* Dokumentiere explizit die Begründung für NDJSON als Replay-v1-Format.
* Dokumentiere Konfig-Priorität und Sicherheitsregeln für Logpfade in konsolidierter Form.
* Ergänze `docs/changelog.md` um den Eintrag „Replay Logging MVP“.
* Halte die Task-Artefakte mit Guardrails/Checklist/Commands aktuell.

## 3) Non-Goals

* Keine Runtime-Codeänderung in Engine/Server/Client.
* Keine Änderung am bestehenden Konfigparser.
* Keine Änderung an Replay-Formatfeldern oder Validatorlogik.

## 4) Inputs

* `docs/design-decisions/DD-0310-config-contract-v1-logging-replay.md`
* `docs/design-decisions/DD-0312-replay-format-v1-record-types-and-deterministic-serialization.md`
* `docs/design-decisions/DD-0314-server-replay-path-validation-and-filename-contract.md`
* `docs/logging-config-v1.md`
* `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI scope)

## 5) Outputs

### 5.1 Code

* N/A (documentation-only)

### 5.2 Tests

* N/A (documentation-only)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0316-replay-logging-mvp-rationale.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Dokumentation muss konsistent mit bestehenden Replay-v1-Entscheidungen bleiben.
* Keine neuen Laufzeitsemantiken einführen.
* Präzedenzregel `SEC > DD > TDD > AGENTS > VISION` muss eingehalten werden.

## 7) Invariants (Must remain true)

* Konfig-Priorität bleibt `CLI > ENV > conf.json > Defaults`.
* Replay-v1 bleibt auf NDJSON festgelegt.
* Sicherheitsregeln für Replay-Logpfade bleiben fail-fast.

## 8) Implementation Plan

* [x] DD-0316 mit den drei geforderten Begründungsblöcken erstellen.
* [x] Changelog-Eintrag „Replay Logging MVP“ in `docs/changelog.md` ergänzen.
* [x] Task-Artefakt inkl. PR-Checklist/Commands vollständig pflegen.
* [x] Lint/Test ausführen und Ergebnisse dokumentieren.

## 9) Acceptance Criteria

* [x] DD enthält explizite Begründung für `logging.replay`.
* [x] DD enthält explizite Begründung für NDJSON.
* [x] DD enthält Konfig-Priorität und Sicherheitsregeln für Logpfade.
* [x] `docs/changelog.md` enthält einen Eintrag mit „Replay Logging MVP“.
* [x] Task-Datei ist vollständig inkl. Guardrails/Checklist/Commands.

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

* Added DD-0316 as consolidated MVP rationale for replay logging decisions.
* Documented why `logging.replay` is the canonical namespace.
* Documented why NDJSON is fixed for replay v1.
* Documented config precedence and log-path safety rules in one ADR.
* Added changelog line with the requested label „Replay Logging MVP“.
* Updated this task artifact with full guardrail/checklist/command evidence.

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm test` → ok
* Frontend QA runbook → N/A (no UI change)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.
