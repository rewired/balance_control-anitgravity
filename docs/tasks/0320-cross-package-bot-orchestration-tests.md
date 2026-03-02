# Task 0320 — Paketübergreifende Bot-Orchestrierungs-Tests (Mensch/KI, KI/KI, Fallback, Determinismus)

**Date:** 2026-03-02
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0320-cross-package-bot-orchestration-tests`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003
* GR-013

### compliance_notes (required if affected_guardrails != NONE)

* GR-003:
  * Determinism wird mit identischem Seed und identischen Mock-LLM-Responses per Endzustands-Hash geprüft.
  * Tests nutzen ein deterministisches Game-Wrapper-Setup (fester Startspielerindex) und verifizieren gleiche Hashes.
* GR-013:
  * Alle Bot-Aktionen werden ausschließlich über legal enumerierte Intents dispatcht.
  * Test-Aussagen verifizieren index-basierte Auswahl/Fallback (kein freies Payload-Bauen).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): present/absent/absent/present/absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-04:INTERACTION_MODEL, ARCH-04:RESTRICTIONS, ARCH-04:DETERMINISM

## 2) Goal

* Ergänze paketübergreifende Integrationstests zwischen `@balance-control/bot-llm` und `@balance-control/game`.
* Decke Mensch-vs-KI sowie KI-vs-KI Zugabläufe mit legalem Dispatch-Surface ab.
* Decke Ollama-Fehlerpfade (ungültige Antwort/Transportfehler) mit deterministischem Fallback ab.
* Verifiziere deterministischen Endzustands-Hash bei identischem Seed + identischen Mock-Antworten.

## 3) Non-Goals

* Keine Änderung an Engine-Regeln, Move-Legalität oder Resolver-Logik.
* Keine UI-Änderungen.
* Keine neuen Move-Typen oder Bot-Protokollfelder.

## 4) Inputs

* Repo areas:
  * `packages/bot-llm/src/adapter.ts`
  * `packages/bot-llm/src/turn-orchestrator.ts`
  * `packages/game/src/index.ts`
* Existing behavior summary (current):
  * Adapter/Orchestrator hatten Unit-Tests, aber keine paketübergreifende End-to-End-Orchestrierung mit realem `@balance-control/game`-Client.

### 4.1 QA Runbook Baseline

* N/A (kein Frontend/UI-Prozess-Umfang)

## 5) Outputs

### 5.1 Code

* `packages/bot-llm/test/cross-package-orchestrator.integration.test.ts` (new)
* `packages/bot-llm/package.json`

### 5.2 Tests

* `packages/bot-llm/test/cross-package-orchestrator.integration.test.ts` (new)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinismus und Seed-Stabilität müssen testseitig verifiziert werden.
* Keine freien Move-Payloads aus LLM-Antworten zulassen.
* Engine-Legalitätsoberfläche bleibt alleinige Autorität für dispatchte Intents.

## 7) Invariants (Must remain true)

* Identische Aktionen auf identischem Seed ergeben identischen Hash.
* Nur legal enumerierte Intents werden dispatcht.
* Fallback bei Fehlern bleibt deterministisch auf Index 0.

## 8) Implementation Plan

* [x] Add cross-package integration test harness with real boardgame client + real game package.
* [x] Add Mensch-vs-KI and KI-vs-KI orchestration scenarios with legal-intent assertions.
* [x] Add invalid-response and timeout fallback scenarios with index-only assertions.
* [x] Add deterministic double-run hash equality scenario.
* [x] Update docs artifacts (task file + changelog).

## 9) Acceptance Criteria

* [x] Mensch-vs-KI test zeigt mindestens eine legale Bot-Aktion.
* [x] KI-vs-KI test läuft mehrere Aktionen ohne Invalid-Move/Deadlock-Abbruch.
* [x] Invalid JSON/Timeout führen deterministisch zum Fallback-Intent (Index 0).
* [x] Gleiches Seed + gleiche Mock-Responses ergeben identischen Hash.
* [x] Tests belegen index-only Auswahl ohne freie Move-Payloads.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added a new cross-package integration suite for bot orchestrator + real game engine client.
* Added Mensch-vs-KI scenario proving legal bot move dispatch after human progression.
* Added KI-vs-KI multi-action scenario with deterministic stop condition and no deadlock.
* Added invalid-response/transport-error fallback scenario proving index-0 deterministic fallback.
* Added deterministic mirror-run hash check using same seed and identical mock LLM outputs.
* Added required dev dependency to run boardgame client in bot-llm integration tests.
* Updated changelog entry for task 0320.

## 12) Commands Run (with outcomes)

* `pnpm install` → ok
* `pnpm lint` → ok
* `pnpm -C packages/rules build && pnpm -C packages/shared build && pnpm -C packages/game build && pnpm -C packages/packs build && pnpm -C packages/bot-llm exec vitest run test/cross-package-orchestrator.integration.test.ts` → ok
* `pnpm -C packages/bot-llm exec vitest run test/adapter.test.ts test/turn-orchestrator.test.ts test/cross-package-orchestrator.integration.test.ts` → ok
* `pnpm test` → fail (pre-existing unrelated `packages/client-web/test/board-viewport.test.tsx` assertion mismatch: extra 4th `setTransform` arg)

### 12.1 Frontend QA command order

* N/A (kein Frontend/UI-Prozess-Scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
