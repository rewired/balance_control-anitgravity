# Task 0327 — Replay v1: deterministische Typspur für Action-Args und Resolver-History

**Date:** 2026-03-04
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0327-replay-typed-field-metadata`

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
  * Änderungen sind rein infrastrukturelle Replay-/History-Metadaten in `packages/game`; keine Regelentscheidung in Client/UI.
  * `typedFields` und History-Typspur bleiben JSON-serialisierbar und führen keine nicht-serialisierbaren Zustände ein.
* GR-003:
  * Typableitung nutzt ausschließlich deterministische Eingaben (`moveType`, `args`, bestehender `G`-State).
  * Keine Zeitstempel, RNG oder UI-only Felder im neuen Metadatenpfad.

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

* CORE: CORE-01-03-02A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Replay-Actionrecords um optionales, deterministisches Typmetadatenfeld (`typedFields`) erweitern.
* Typableitung zentralisieren (single mapper statt verteilter Move-Logik).
* Kritische Move-Payloads (insb. `convertResources`) mit domänenspezifischen Feldtypen annotieren.
* Resolver-History um minimale Typspur (`tileType`, `resourceType`) ergänzen.
* Replay-Vertrag + Changelog + DD aktualisieren.

## 3) Non-Goals

* Keine Änderung an Spielregeln, Legality oder Kostenberechnung.
* Keine UI/Frontend-Änderungen.
* Kein Umbau des NDJSON-Dateiformats außerhalb des optionalen `typedFields`-Feldes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/src/engine/resolver.ts`
  * `packages/game/src/replay-verify.ts`
  * `packages/game/test/replay-sink.test.ts`
  * `packages/game/test/replay-verify.test.ts`
  * `packages/game/test/resolver.test.ts`
  * `docs/replay-format-v1.md`
* Existing behavior summary (current):
  * Replay `action` records loggen bisher nur rohe `args` ohne domänenspezifische Typmetadaten.
  * `engine.history` protokolliert bisher `atom` und ggf. `tileId`, aber keine Typspur wie `tileType`/`resourceType`.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (kein client-web UI/prozess scope)

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-typed-fields.ts`
* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/engine/resolver.ts`
* `packages/game/src/replay-verify.ts`
* `packages/game/src/index.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`
* `packages/game/test/resolver.test.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`
* `packages/game/test/resolver.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0327-replay-typed-fields-metadata.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Nur deterministisch ableitbare Typinfos loggen.
* Zentrale Typableitung im Replay-Pfad (keine duplizierte Move-spezifische Switch-Logik in Move-Dateien).
* Rückwärtskompatibilität: `typedFields` bleibt optional.

## 7) Invariants (Must remain true)

* Identische Zugfolge liefert identische Replay-Records + State Hashes.
* Replay-Verifizierung bleibt action-sequenzgetrieben.
* Engine-State bleibt JSON-serialisierbar und deterministisch.

## 8) Implementation Plan

* [x] Zentralen Mapper für Replay-`typedFields` einführen und im Replay-Sink verdrahten.
* [x] `convertResources` (typed/untyped) und relevante Felder weiterer Kernmoves im Mapper abdecken.
* [x] Replay-Verifier um optionale `typedFields`-Schema-Validierung erweitern.
* [x] `engine.history` um minimale Typspur (`tileType`/`resourceType`) ergänzen.
* [x] Tests + Doku + DD + Changelog aktualisieren.

## 9) Acceptance Criteria

* [x] `action` records können optional deterministische `typedFields` enthalten.
* [x] Typableitung liegt zentral im Replay-Pfad.
* [x] `convertResources` typed/untyped Varianten werden in `typedFields` unterscheidbar annotiert.
* [x] Resolver-History enthält zusätzliche deterministische Typspur ohne Regeländerung.
* [x] Replay-Format-Dokument und Changelog sind aktualisiert.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (targeted replay/history tests)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary

* Replay-Actionrecordmodell um optionales `typedFields` erweitert.
* Neuen zentralen Mapper `deriveReplayTypedFields(...)` für domänenspezifische Feldtypen ergänzt.
* `convertResources` typed/untyped sowie weitere politische Payloadfelder deterministisch annotiert.
* Replay-Verifier validiert optionales `typedFields` fail-fast auf erlaubte Domänentypen.
* Resolver-History um `tileType`/`resourceType`-Spur für bessere Nachvollziehbarkeit erweitert.
* Replay-Format-v1-Dokument, DD-0327 und Changelog aktualisiert.

## 12) Commands Run (with outcomes)

* `pnpm --dir packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts test/resolver.test.ts` → ok (3 files, 17 tests passed)
* `pnpm lint` → ok
* `pnpm test` → fail (pre-existing `check:spec-anchors` violation in `packages/game/src/engine/atoms/hotspot.ts` for invalid anchor `CORE-01-06-03C`)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (kein UI/prozess scope)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
