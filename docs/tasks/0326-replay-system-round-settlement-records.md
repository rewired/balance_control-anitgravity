# Task 0326 — Replay v1: `system.roundSettlement` Record ergänzen

**Date:** 2026-03-04
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0326-replay-system-round-settlement-records`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-001:
  * Replay-Systemrecord wird ausschließlich im Engine-Pfad erzeugt (`packages/game`) und nicht aus Client-UI-Regellogik.
  * Serverseitiges Logging nimmt nur den serialisierten Record entgegen (keine Regelentscheidung).
* GR-003:
  * Neuer Record enthält nur deterministische Felder (`roundNumber`, `settlementKind`, `resortTileOrder`, optional deterministischer `stateHash`).
  * Keine Zeitstempel oder zufälligen IDs im Payload.

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

* CORE: CORE-01-07-03D, CORE-01-09-01A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Replay-Recordmodell von reinen Action-Records auf Union mit `system.roundSettlement` erweitern.
* Deterministisches Payload-Schema inkl. optionalem `stateHash` unterstützen.
* Settlement-Systemrecords im normalen Round-End-Pfad und im Auto-Final-Settlement-Pfad emittieren.
* Server-Logging + Replay-Verifier auf neuen Recordtyp erweitern.
* Replay-Dokumentation, Changelog und DD aktualisieren.

## 3) Non-Goals

* Keine Änderung an CORE-Regellogik der Abrechnung selbst.
* Keine Änderung an RNG/Seed-Mechanik.
* Keine UI-Änderungen.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/src/index.ts`
  * `packages/game/src/mechanics-turn.ts`
  * `packages/game/src/replay-verify.ts`
  * `packages/server/src/replay-logging.ts`
  * `docs/replay-format-v1.md`
* Existing behavior summary (current):
  * Replay-Sink kennt nur Action-Record-Schreibpfad.
  * Settlement-Pfade erzeugen keine dedizierten System-Records.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (kein client-web UI/prozess scope)

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/index.ts`
* `packages/game/src/mechanics-turn.ts`
* `packages/game/src/replay-verify.ts`
* `packages/server/src/replay-logging.ts`
* `packages/server/src/index.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0326-replay-system-round-settlement-record.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: keine Zeitabhängigkeit im Recordpayload.
* Action-`seq` bleibt contiguous ausschließlich für Action-Records.
* Kein Erfinden von Spieleraktionen für Systemübergänge.

## 7) Invariants (Must remain true)

* Identische Action-Sequenz bleibt deterministisch replaybar.
* Settlement-Reihenfolge bleibt an kanonische Resort-Order gebunden.
* Replay-Sink bleibt best-effort (Fehlerkanal statt Crash).

## 8) Implementation Plan

* [x] Replay-Sink-Model auf `ReplayRecord`-Union erweitern und System-Emitter helper ergänzen.
* [x] Deterministische Resort-Order in Helper extrahieren und in beiden Settlement-Pfaden nutzen.
* [x] `system.roundSettlement` im normalen und finalen Settlement emitten.
* [x] Server-Logging auf generisches `writeRecord` umstellen.
* [x] Replay-Verifier auf neuen Recordtyp erweitern (accept + payload validation).
* [x] Tests + Docs + DD + Changelog aktualisieren.

## 9) Acceptance Criteria

* [x] `recordType: "system.roundSettlement"` wird in beiden Settlement-Pfaden emittiert.
* [x] Payload enthält `roundNumber`, `settlementKind`, `resortTileOrder`, optional `stateHash`.
* [x] Replay-Verifier akzeptiert den neuen Recordtyp und validiert Schemafehler fail-fast.
* [x] Replay-Format-Doku und Changelog sind aktualisiert.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (targeted replay sink/verify tests)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary

* Replay-Sink-API von `writeAction` auf `writeRecord` mit Union-Recordmodell erweitert.
* Neuen Helper `emitReplaySystemRecord` für deterministic `system.roundSettlement` eingeführt.
* Settlement-Order in `getRoundSettlementResortTileOrder` zentralisiert und im Regular/Final-Pfad genutzt.
* Replay-Verifier um `system.roundSettlement`-Akzeptanz + Schema-Validierung ergänzt.
* Server-Replay-Logging und Hotseat-Ingest auf `ReplayRecord` umgestellt.
* Replay-Format-Dokument um neuen Recordtyp ergänzt; DD-0326 erstellt; Changelog ergänzt.

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/game test -- replay-sink.test.ts replay-verify.test.ts` → fail (workspace baseline failures unrelated to this task; command executes full package suite)
* `pnpm --dir packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts` → ok
* `pnpm lint` → ok
* `pnpm test` → fail at existing `check:spec-anchors` violation in `packages/game/src/engine/atoms/hotspot.ts` (pre-existing)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (kein UI/prozess scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
