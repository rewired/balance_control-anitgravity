# Task 0341 — Replay boundary TSDoc hardening

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003
* GR-012

### compliance_notes

* GR-003: Changes are documentation-only and reinforce deterministic replay contract language; no runtime behavior was modified.
* GR-012: TSDoc now explicitly states that optional `matchConfig`/`expansions` on body records are header-consistent metadata echoes, preserving canonical config authority semantics.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT
* FORMAT: `/docs/replay-format-v1.md` sections 3.1, 3.2, 3.3, 3.4

## 2) Goal

* Harden exported replay boundary API docs in `replay-sink.ts` without changing behavior.
* Clarify required/optional semantics for `matchConfig` and `expansions` across record types.
* Ensure required documentation tags are present for these boundary exports.

## 3) Non-Goals

* No replay payload schema behavior changes.
* No verifier logic or sink runtime mutation changes.
* No client-web or server code changes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
* Existing behavior summary:
  * Exported types existed but lacked full boundary semantics narrative and explicit optional metadata echo guidance.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/client-web/process scope).

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`

### 5.2 Tests

* No test source changes.

### 5.3 Docs

* [x] `/docs/changelog.md` updated.
* [x] `/docs/design-decisions/DD-0341-replay-boundary-tsdoc-hardening.md` created.
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not needed; no rule-text clarification).

## 6) Constraints (Hard)

* Maintain exact runtime type behavior and interfaces.
* Keep replay contract deterministic and header-consistent.
* Use ARCH-05-compatible TSDoc tags.

## 7) Invariants (Must remain true)

* Replay emission order and payload values are unchanged.
* Optional metadata fields remain optional.
* Deterministic replay semantics remain unchanged.

## 8) Implementation Plan

* [x] Add TSDoc blocks to the four exported boundary symbols.
* [x] Document `matchConfig`/`expansions` optional + canonical header relation semantics.
* [x] Add determinism/remarks and purity/side-effects tags as applicable.
* [x] Update changelog and DD/task artifacts.

## 9) Acceptance Criteria

* [x] Target exported symbols include TSDoc contract blocks.
* [x] `matchConfig` and `expansions` semantics are explicitly documented.
* [x] Required contract tags (`@deterministic`, `@remarks`, and pure/side-effects marker) are present.
* [x] No runtime behavior changes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (doc-only; replay sink test pass)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary

* Added TSDoc contract blocks for `ReplayActionRecord`, `ReplaySystemRoundSettlementRecord`, `ReplayCheckpointRecord`, and `ReplaySink`.
* Documented optional `matchConfig`/`expansions` behavior and canonical relationship to replay header metadata.
* Added determinism + purity/side-effects tags to boundary docs for ARCH-05 compliance.
* Added DD-0341 decision record for this documentation hardening.
* Updated `docs/changelog.md` with task(0341) entry.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
