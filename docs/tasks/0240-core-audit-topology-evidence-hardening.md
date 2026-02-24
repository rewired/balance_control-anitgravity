# Task 0240 — Core Topology Evidence Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0240-core-topology-evidence-hardening`

---

**Task State:** VERIFYING

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-003
* GR-011

### compliance_notes (required if affected_guardrails != NONE)
* GR-003: Add deterministic topology tests only; no runtime randomness changes.
* GR-011: Validate canonical sweep/topology interactions without altering production algorithm.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-00-11, CORE-01-00-12, CORE-01-00-T07A, CORE-01-07-03D
* ARCH: ARCH-01:DETERMINISM

## 2) Goal
* Convert topology obligations currently backed only by file-level binding into assertion-level tests.
* Add explicit adjacency and canonical traversal checks with stable fixtures.

## 3) Non-Goals
* No expansion topology logic.
* No UI rendering work.

## 4) Inputs
* Repo areas:
  * packages/game/src/engine/topology.ts
  * packages/game/test/engine-topology.test.ts
  * docs/architecture/CORE-01-OBLIGATIONS.json
* Existing behavior summary (current): topology tests exist but several obligations lack explicit ID-linked assertions.

## 5) Outputs
### 5.1 Code
* packages/game/src/engine/topology.ts (only if testability hooks needed)
### 5.2 Tests
* packages/game/test/engine-topology.test.ts
* packages/game/test/resolver-invariants.test.ts
### 5.3 Docs
* [ ] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* Deterministic-only tests and fixtures.
* No production logic changes unless explicitly required by failing invariant.

## 7) Invariants (Must remain true)
* Identical move sequence → identical state hash.
* Zone integrity remains unchanged.

## 8) Implementation Plan
* [ ] Add explicit tests for CORE-01-00-11 and CORE-01-00-12.
* [ ] Add assertion-level mapping comments for topology obligations.
* [ ] Re-run audits and update registry evidence links if needed.

## 9) Acceptance Criteria
* [ ] Topology obligations have executable tests with explicit assertions.
* [ ] `pnpm -w audit:core-obligations` reports no SUSPECT entries for listed IDs.
* [ ] `pnpm -C packages/game test -- engine-topology.test.ts resolver-invariants.test.ts` passes.

## 10) PR Checklist (Repo Artifact)
* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (not run in this audit-only task)
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)
* Ran core obligation audit and cross-checked executable evidence policy against normative entries.
* Identified taxonomy drift (`NORMATIVE_DATA`) and evidence-link granularity gaps for normative IDs.
* Prepared implementation-ready follow-up tasks (0240–0244) clustered by mechanics to remediate weak/suspect evidence.
* Captured canonical command outcomes for install/test/spec-audit/obligation-audit/spec-anchor checks.

## 12) Commands Run (with outcomes)
* `pnpm -w install` → OK (already up to date).
* `pnpm -w test` → FAIL (workspace expansion test import failure for `@balance-control/rules`).
* `pnpm -w audit:spec` → FAIL (`verify:packs` requires prior build artifacts).
* `pnpm -w audit:core-obligations` → OK (193 IDs scanned; registry consistency reported).
* `pnpm -w check:spec-anchors` → OK (no invalid anchors).

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
* N/A

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* N/A

## 15) Amendments (append-only)
* N/A
