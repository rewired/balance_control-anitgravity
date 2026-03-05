# Task 0318 — Bot-LLM Turn Orchestrator für vollständigen Zugzyklus

**Date:** 2026-03-02
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0318-bot-turn-orchestrator`

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
  * Orchestrator dispatcht ausschließlich Intents aus `selectIntentWithOllama`.
  * Keine freien Move-Typen oder Payload-Konstruktion.
* GR-013:
  * Bot-Ablauf bleibt auf legaler Enumeration + indexbasierter Auswahl.
  * Engine-Commit erfolgt nur über Host-Callback `dispatchIntent(intent, context)`.

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

* Implementiere `packages/bot-llm/src/turn-orchestrator.ts` für einen vollständigen KI-Zugzyklus.
* Nutze den Ablauf legal enumerate → Ollama-Request → Auswahlvalidierung → Engine-Dispatch.
* Definiere eine wiederverwendbare Dispatch-Schnittstelle für Server und Hotseat.
* Füge konfigurierbare Loop-Guards (`maxTurns`, `maxConsecutiveBotActions`) für KI-vs-KI hinzu.

## 3) Non-Goals

* Keine Änderung an Engine-Legalitätsregeln.
* Keine neuen Intent-/Move-Typen.
* Keine UI-Komponentenänderung.

## 4) Inputs

* `packages/bot-llm/src/adapter.ts`
* `packages/bot-llm/src/ollama-client.ts`
* `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

### 4.1 QA Runbook Baseline

* N/A (kein Frontend-UI-Change)

## 5) Outputs

### 5.1 Code

* `packages/bot-llm/src/turn-orchestrator.ts` (new)
* `packages/bot-llm/src/index.ts`

### 5.2 Tests

* `packages/bot-llm/test/turn-orchestrator.test.ts` (new)

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0318-bot-turn-orchestrator-dispatch-boundary.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Nur legal enumerierte Intents dürfen dispatcht werden.
* Host-agnostische Schnittstelle (Server/Hotseat wiederverwendbar).
* Loop-Guards müssen deterministisch greifen.

## 7) Invariants (Must remain true)

* Keine freie Move-Konstruktion im Bot-Layer.
* Bot-Entscheidung bleibt index-basiert über legales Intent-Surface.
* Orchestrator führt keine Engine-Bypass-Mutationen aus.

## 8) Implementation Plan

* [x] Add `runTurnOrchestrator(...)` with callback-based dispatch boundary.
* [x] Add configurable loop guards for max turns and max consecutive bot actions.
* [x] Export orchestrator API via package index.
* [x] Add unit tests for complete cycle, no-legal-moves stop, and loop-guard behavior.
* [x] Update docs artifacts (task file + DD + changelog).

## 9) Acceptance Criteria

* [x] Orchestrator inputs include `G`, `ctx`, `playerID`, bot config.
* [x] Orchestrator executes legal-enumeration/LLM/select pipeline via existing adapter path.
* [x] Engine move invocation is host-integrated via callback `dispatchIntent(intent, context)`.
* [x] Max-turn/max-actions guard works deterministically for KI-vs-KI loops.
* [x] New tests pass in `packages/bot-llm`.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm -C packages/bot-llm test` passes
* [x] Determinism verified (index-only + deterministic loop guards)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added a reusable bot turn orchestrator to execute full bot action cycles.
* Kept the legal-intent + strict selection path by delegating to `selectIntentWithOllama`.
* Added host callbacks (`dispatchIntent`, optional `getLatestSnapshot`) for server/hotseat integration.
* Added deterministic stop reasons and loop-guard limits for bot-vs-bot safety.
* Exported orchestrator types/APIs and added focused unit tests.
* Added DD-0318 and changelog entry.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/bot-llm test` → fail (pre-existing workspace build-order issue in `packages/packs`: cannot resolve `@balance-control/game` during `tsc`)
* `pnpm -C packages/bot-llm exec vitest run test/turn-orchestrator.test.ts` → ok
* `pnpm lint` → ok
* `pnpm test` → fail (same pre-existing `packages/packs` build issue during `packages/bot-llm` pretest)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
