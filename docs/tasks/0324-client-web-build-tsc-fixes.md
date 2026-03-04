# Task 0324 — Fix client-web TypeScript build regressions (bot imports, seat typing, setupData opt)

**Date:** 2026-03-03
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002
* GR-013
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Fix is TypeScript/project wiring only; legality/cost/majority execution remains engine-owned.
* GR-013: Bot bridge keeps existing index-based orchestrator usage and does not bypass legal-intent enumeration.
* GR-014: No visual icon/semantic mapping changes were introduced.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC absent, DD present, TDD absent, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (tooling/typing integration only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-04:INTERACTION_MODEL

## 2) Goal

* Resolve `packages/client-web` build failure (`tsc && vite build`) caused by TS6307/TS2339/TS2353.
* Preserve current runtime behavior for hotseat setup and bot orchestration.

## 3) Non-Goals

* No rules-engine/state-mutation logic changes.
* No UI behavior redesign.

## 4) Inputs

* `packages/client-web/tsconfig.json`
* `packages/client-web/src/bot/orchestratorBridge.ts`
* `packages/client-web/src/hotseat/HotseatShell.tsx`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` applies.

## 5) Outputs

### 5.1 Code

* `packages/client-web/tsconfig.json`
* `packages/client-web/src/bot/orchestratorBridge.ts`
* `packages/client-web/src/hotseat/HotseatShell.tsx`

### 5.2 Tests

* N/A (validated via existing build pipeline command)

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0324-client-web-build-ts-fixes.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

## 6) Constraints (Hard)

* Determinism unchanged.
* Engine authority unchanged.
* No phantom moves.

## 7) Invariants (Must remain true)

* Bot orchestrator remains legal-intent constrained.
* Hotseat setup data remains sourced from validated config.

## 8) Implementation Plan

* [x] Extend client-web TS project scope to include bot-llm source imports.
* [x] Fix SeatConfig narrowing in orchestrator bridge.
* [x] Resolve `setupData` option typing without altering runtime behavior.
* [x] Validate with `pnpm -C packages/client-web build`.

## 9) Acceptance Criteria

* [x] Client-web build succeeds with no TS6307/TS2339/TS2353 errors.
* [x] Fix remains scoped to typing/build integration.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes (build validation command used)
* [x] Determinism verified (no deterministic logic changed)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added `@balance-control/bot-llm` path and `../bot-llm/src` include to client-web TS config to satisfy TS6307 project file listing.
* Added explicit bot-seat narrowing helper returning `SeatBotConfig` before reading `.model`.
* Applied a local type assertion on hotseat `Client(...)` options to admit existing `setupData` runtime usage without changing behavior.
* Added DD-0324 and changelog entry for auditability.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web build` → fail initially (TS2322/TS2740/TS2322/TS2698/TS2339 after first patch), then pass after final fixes (tsc + vite build completed).
* `pnpm lint` → pass.

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm -C packages/client-web build` → ok.
* Additional runbook commands: N/A for this build-break fix scope.

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
