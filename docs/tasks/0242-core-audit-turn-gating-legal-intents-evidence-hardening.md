# Task 0242 — Core Turn Gating and Legal Intents Evidence Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0242-core-turn-gating-legal-intents-evidence-hardening`

---

**Task State:** DRAFT

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-004
* GR-005
* GR-006

### compliance_notes (required if affected_guardrails != NONE)
* GR-004: All legality remains through enumerateLegalIntents.
* GR-005: No non-spec intents are introduced.
* GR-006: PendingChoice gate remains exclusive.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-04-01, CORE-01-04-02, CORE-01-04-03, CORE-01-04-08, CORE-01-04-09, CORE-01-04-10
* ARCH: ARCH-03:PENDING_CHOICE

## 2) Goal
* Add direct executable proof that turn gating and intent legality are sound.
* Remove reliance on incidental outcomes in broad move tests.

## 3) Non-Goals
* No LLM bot changes.
* No UI-only action gating.

## 4) Inputs
* packages/game/src/engine/legal-intents.ts
* packages/game/test/legal-intents.test.ts
* packages/game/test/turn.test.ts

## 5) Outputs
### 5.1 Code
* packages/game/src/engine/legal-intents.ts (if bug found)
### 5.2 Tests
* packages/game/test/legal-intents.test.ts
* packages/game/test/turn.test.ts
### 5.3 Docs
* [ ] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* Legal intents remain pure and deterministic.
* PendingChoice exclusivity must be asserted explicitly.

## 7) Invariants (Must remain true)
* No phantom moves.
* Turn phase legality is canonical and reproducible.

## 8) Implementation Plan
* [ ] Add explicit per-rule tests for legal intent presence/absence.
* [ ] Add tests proving only ResolveChoice intents are legal under pendingChoice.
* [ ] Re-run targeted legality tests and obligation audit.

## 9) Acceptance Criteria
* [ ] Listed IDs have assertion-level executable proof.
* [ ] `pnpm -C packages/game test -- legal-intents.test.ts turn.test.ts` passes.
* [ ] `pnpm -w audit:core-obligations` has no WEAK/SUSPECT for listed IDs.

## 10) PR Checklist (Repo Artifact)
* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* N/A

## 12) Commands Run (with outcomes)
* N/A

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
* N/A

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* N/A

## 15) Amendments (append-only)
* N/A
