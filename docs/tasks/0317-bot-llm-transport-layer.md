# Task 0317 — Bot-LLM dedizierter Ollama-Transport-Layer

**Date:** 2026-03-02
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0317-bot-llm-transport-layer`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-005
* GR-013

### compliance_notes (required if affected_guardrails != NONE)

* GR-005:
  * Bot-Auswahl bleibt strikt index-basiert auf `enumerateLegalIntents`.
  * Fallback nutzt deterministisch Option `0`, nie frei konstruierte Moves.
* GR-013:
  * Neuer Transport-Layer trennt I/O von Auswahl-Validierung.
  * Validierung bleibt in `adapter.ts` via `parseLLMSelection`/`LLMSelectionSchema`.

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

* CORE: CORE-01-04-09
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-04:INTERACTION_MODEL, ARCH-04:RESTRICTIONS, ARCH-04:DETERMINISM

## 2) Goal

* Implementiere dedizierten Transport in `packages/bot-llm/src/ollama-client.ts`.
* Nutze Bot-Konfiguration für Endpoint/Model/Timeout.
* Halte Validierung zentral in Adapter (`parseLLMSelection`/Schema).
* Füge Fehlerpfade mit deterministischem Fallback hinzu.
* Decke alle geforderten Unit-Test-Szenarien per gemocktem HTTP-Client ab.

## 3) Non-Goals

* Keine Änderungen an Engine-Legalitätslogik.
* Keine neuen Move-Typen oder freie Payload-Konstruktion.
* Keine UI/Server-Integration.

## 4) Inputs

* `packages/bot-llm/src/adapter.ts`
* `packages/bot-llm/src/index.ts`
* `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

### 4.1 QA Runbook Baseline

* N/A (kein Frontend/UI Scope)

## 5) Outputs

### 5.1 Code

* `packages/bot-llm/src/ollama-client.ts` (new)
* `packages/bot-llm/src/adapter.ts`
* `packages/bot-llm/src/index.ts`

### 5.2 Tests

* `packages/bot-llm/test/adapter.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0317-bot-llm-transport-layer-and-fallback.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keine nicht-deterministische Move-Konstruktion.
* Nur index-basierte Bot-Auswahl.
* Netzwerk-/Timeout-Fehler führen deterministisch zum Fallback.

## 7) Invariants (Must remain true)

* Legalität kommt ausschließlich aus Engine-Enumeration.
* Antwortvalidierung erfolgt strikt über bestehendes Schema.
* Fallback bleibt stabil und reproduzierbar.

## 8) Implementation Plan

* [x] Add `requestOllamaSelection(...)` transport with config-driven endpoint/model/timeout.
* [x] Add adapter orchestration that reuses existing validation path and deterministic fallback.
* [x] Extend tests for valid response, invalid JSON, schema violation, out-of-range, timeout/network failure.
* [x] Update docs artifacts (changelog + DD + task file).

## 9) Acceptance Criteria

* [x] Transport-Funktion gibt Ollama-`response` als String zurück.
* [x] Adapter nutzt bestehende Parsing-/Schema-Validierung.
* [x] Keine freie Move-Konstruktion; nur index-basierte Auswahl.
* [x] Fehler/Timeout führen zu deterministischem Fallback.
* [x] Tests decken alle 5 geforderten Szenarien ab.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm -C packages/bot-llm test` passes
* [x] Determinism verified (index-only + deterministic fallback)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added dedicated Ollama transport module with typed config and injectable HTTP client.
* Added async adapter orchestration for request + existing schema validation + stale check.
* Kept deterministic fallback behavior for invalid/failed transport flows.
* Added unit tests for all required transport/validation scenarios.
* Added DD-0317 and changelog entry.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/bot-llm test` → ok
* `pnpm lint` → ok
* `pnpm test` → fail (pre-existing unrelated failure in `packages/client-web/test/board-viewport.test.tsx`: expectation still uses 3-arg `setTransform`, runtime now calls with 4 args)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
