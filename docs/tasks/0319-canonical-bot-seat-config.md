# Task 0319 — Kanonische Bot-Sitz-/Modell-Konfiguration mit Hotseat+Multiplayer Wiring

**Date:** 2026-03-02
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0319-canonical-bot-seat-config`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-002
* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Seat/Bot-Konfiguration ist JSON-serialisierbarer Bestandteil von `GameConfig` und wird nur über Setup normalisiert.
* GR-002: UI baut nur Setup-Konfiguration; keine Regel-/Legalitätsberechnung im Client.
* GR-003: Keine neue nichtdeterministische Quelle; Konfig ist statisch und strikt validiert.
* GR-012: Eine kanonische Normalisierung (`normalizeGameConfig`) ist Autorität für Seat/Bot-Konfig in Hotseat und Multiplayer.

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

* CORE: N/A (infrastructure config/startflow)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-01:STATE_AUTHORITY, ARCH-04:INTERACTION_MODEL

## 2) Goal

* Definiere kanonisches Seat/Bot-Config-Schema (`human | bot`) inkl. Ollama-Modelloptionen.
* Erzwinge strikte Validierung in Match-/Config-Normalisierung.
* Nutze identische Auswertung in Hotseat und Multiplayer StartFlow.
* Ergänze Start-UI für Mensch vs KI und KI vs KI.

## 3) Non-Goals

* Keine Implementierung automatischer Bot-Zugausführung im Server.
* Keine Änderung an Engine-Regelauflösung oder Move-Pfaden.

## 4) Inputs

* `packages/game/src/config.ts`
* `packages/client-web/src/components/StartScreen.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`
* `packages/client-web/src/hotseat/HotseatShell.tsx`

### 4.1 QA Runbook Baseline

* Frontend-Screenshot versucht (siehe Ergebnis in Abschlussbericht).

## 5) Outputs

### 5.1 Code

* `packages/rules/src/config.ts`
* `packages/game/src/config.ts`
* `packages/client-web/src/config/matchConfig.ts`
* `packages/client-web/src/components/StartScreen.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`
* `packages/client-web/src/hotseat/HotseatShell.tsx`
* `packages/client-web/src/App.tsx`

### 5.2 Tests

* `packages/game/test/config-normalization.test.ts`
* `packages/client-web/test/match-config.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0319-canonical-bot-seat-config.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Striktes Schema ohne implizite Provider.
* Kein Engine-State-Mutate außerhalb regulärer Setup-/Move-Pfade.

## 7) Invariants (Must remain true)

* Match-Config bleibt kanonische Single Source of Truth.
* Hotseat und Multiplayer nutzen denselben SetupData-Shape.
* Keine impliziten Regeln/Phantom-Moves.

## 8) Implementation Plan

* [x] Add seat/bot schema in config types and strict zod validation in game normalization.
* [x] Add shared client builder for canonical validated setupData.
* [x] Wire setupData into hotseat creation path.
* [x] Wire setupData into lobby createMatch path.
* [x] Add tests for normalization + client builder behavior.
* [x] Update docs artifacts (DD + changelog + task file).

## 9) Acceptance Criteria

* [x] Seat schema supports `human` and `bot` with `provider=ollama` and `model`.
* [x] Invalid seat schema is rejected deterministically.
* [x] Start flow supports Mensch vs KI and KI vs KI.
* [x] Hotseat and lobby multiplayer use consistent setupData generation.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` passes (fails on pre-existing bot-llm/packs workspace build issue)
* [x] Determinism verified
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added canonical seat/bot config types to shared rules config.
* Added strict zod validation for seats in game config normalization.
* Added shared client setupData builder reused by hotseat and lobby create flows.
* Extended StartScreen and Lobby create form for Mensch vs KI / KI vs KI and model input.
* Wired hotseat client setupData to pass canonical seats into local match setup.
* Added regression tests for schema normalization and client setup builder.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/config-normalization.test.ts test/replay-runner.test.ts` → ok
* `pnpm -C packages/client-web exec vitest run test/match-config.test.ts test/start-flow-mode-select.smoke.test.tsx` → ok
* `pnpm lint` → ok
* `pnpm test` → fail (pre-existing `@balance-control/packs` build cannot resolve `@balance-control/game` in bot-llm pretest)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* Added frontend screenshot evidence for updated start-flow seat mode selector and bot model input.
* Updated command outcomes/checklist statuses after implementation and validation.
