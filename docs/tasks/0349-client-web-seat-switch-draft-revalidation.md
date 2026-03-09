# Task 0349 — Client-web seat switch draft revalidation

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `task/0349-seat-switch-draft-revalidation`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002
* GR-005
* GR-006
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Draft legality is revalidated from engine-provided legal intents only (`vm.intents`), no client-side rules computation added.
* GR-005: No new move types/actions are introduced; behavior only gates existing Confirm dispatch.
* GR-006: Pending-choice hard-gate remains untouched and still blocks confirm/selection flows.
* GR-014: UI-only invalid indication/disabled confirm changes are presentation and interaction contract hardening.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present (`ARCH-00`, `ARCH-06`), DD present (repo DD corpus + new DD-0349), TDD present (this task file), AGENTS present (`/AGENTS.md`), VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (UI contract hardening only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06-UI-INTERACTION-CONTRACT (draft confirmation must remain explicit; no auto-commit)

## 2) Goal

* Preserve mounted draft across hotseat seat switch.
* Revalidate draft legality against legal intents of the newly active seat.
* Disable Confirm for illegal draft after switch, without auto-dispatch.
* Stabilize E2E assertion timing around disabled state and unchanged state id.

## 3) Non-Goals

* No changes to engine legality computation or move semantics.
* No changes to pendingChoice ownership model.
* No multiplayer lobby behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  * `packages/client-web/test/interaction-controller-machine.test.ts`
  * `e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts`
* Existing behavior summary (current): controller cleared draft on seat switch via `[myPid]` reset effect, preventing mounted-draft invalidation UX from being observable.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` (applied)

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
* `e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts`

### 5.2 Tests

* `packages/client-web/test/interaction-controller-machine.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: unchanged.
* Engine authority: legality source remains engine intents.
* No phantom moves: unchanged.
* No implicit rules: unchanged.

## 7) Invariants (Must remain true)

* UI remains presentation-only.
* Confirm dispatch remains explicit user action.
* State id remains unchanged on seat switch without confirm.

## 8) Implementation Plan

* [x] Step 1: annotate E2E flow with Given/When/Then and explicit waits.
* [x] Step 2: remove seat-switch draft reset and enforce legality revalidation gating in confirm path.
* [x] Step 3: add/update unit test for illegal-after-switch draft behavior.
* [x] Step 4: run required UI/e2e checks.

## 9) Acceptance Criteria

* [x] Existing draft remains mounted after seat switch.
* [x] Draft legal flag re-evaluates against new seat legal intents.
* [x] Confirm disabled when draft is illegal after switch.
* [x] No auto-commit/state change occurs on seat switch.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added stable Given/When/Then commentary and explicit post-switch polling to ARCH-06 E2E draft invalidation spec.
* Kept mounted draft through seat switch by removing player-change full reset in interaction controller.
* Centralized draft legality predicate and used it both for UI disabled state and confirm hard-gate.
* Added unit coverage proving draft is retained but revalidated to illegal when legal intents differ after seat switch.
* Updated changelog and created DD-0349 for interaction contract decision trace.

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm test` → ok
* `pnpm run test:ui:unit` → ok
* `pnpm run test:ui:coverage` → ok
* `pnpm run test:ui:e2e` → fail (environment limitation: Playwright chromium binary missing in container)
* `pnpm run test:ui:e2e -- e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts` → fail (same Playwright browser binary limitation)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → ok
* `pnpm run test:ui:unit` → ok
* `pnpm run test:ui:coverage` → ok
* `pnpm run test:ui:e2e` → fail (environment limitation: Playwright chromium binary missing in container)

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

N/A
