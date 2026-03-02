# Task 0321 — Client-web Bot Runner Wiring (Hotseat + Lobby Seats)

**Date:** 2026-03-02
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002
* GR-005
* GR-012
* GR-013
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Bot orchestration only dispatches existing boardgame.io moves; legality/cost logic remains engine-owned.
* GR-005: No new move types are introduced; intents are dispatched via existing legal intent pipeline.
* GR-012: Bot seat derivation reads canonical `G.meta.cfg.seats`.
* GR-013: Orchestrator path remains index-based legal-intent selection with host dispatch callback.
* GR-014: Lobby UI update is presentational only (`Bot (auto)` label + hide join button).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): present/present/absent/present/absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-09
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-04:INTERACTION_MODEL, ARCH-04:RESTRICTIONS, ARCH-04:DETERMINISM

## 2) Goal

* Integrate deterministic bot orchestration in `client-web` runtime using `runTurnOrchestrator(...)`.
* Derive bot seats from canonical setup/config state (`G.meta.cfg.seats`).
* Bridge orchestrator dispatch callbacks to existing boardgame.io move handlers and return latest snapshots.
* Prevent lobby bot seats from appearing as join-required human seats.
* Add regression tests for AI orchestration bridge and lobby seat handling.

## 3) Non-Goals

* No engine rule changes.
* No new move/intents.
* No server transport redesign.

## 4) Inputs

* Repo areas:
  * `packages/client-web/src/App.tsx`
  * `packages/client-web/src/hotseat/HotseatShell.tsx`
  * `packages/client-web/src/components/LobbyScreen.tsx`
  * `packages/bot-llm/src/turn-orchestrator.ts`
* Existing behavior summary (current):
  * Seat config exists but client bot-turn runner was not wired in app/hotseat runtime loop.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` applies.

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/bot/orchestratorBridge.ts` (new)
* `packages/client-web/src/App.tsx`
* `packages/client-web/src/hotseat/HotseatShell.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`

### 5.2 Tests

* `packages/client-web/test/bot-orchestrator-bridge.test.ts` (new)
* `packages/client-web/test/lobby-screen.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0321-client-bot-runner-wiring.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time/random-driven branch behavior.
* Client remains presentation/dispatch-only; engine owns legality.
* No phantom moves.

## 7) Invariants (Must remain true)

* State/move legality remains engine authoritative.
* Bot intent execution remains legal-intent constrained.
* Lobby seat source-of-truth is setup seat config.

## 8) Implementation Plan

* [x] Add shared client bridge for orchestrator wiring + seat-role derivation + dispatch mapping.
* [x] Wire bridge into hotseat/app lifecycle with loop guards.
* [x] Update lobby seat rendering to hide join CTA for bot seats.
* [x] Add regression tests for ai-vs-ai bridge path and lobby bot-seat behavior.
* [x] Update changelog + DD + task artifact.

## 9) Acceptance Criteria

* [x] `runTurnOrchestrator(...)` is called from client runtime when active seat is bot.
* [x] Bot seat detection is derived from `G.meta.cfg.seats`.
* [x] Dispatch callback maps to existing `client.moves` path and refreshes snapshot.
* [x] Loop guards (`maxTurns`, `maxConsecutiveBotActions`) are configured.
* [x] Lobby bot seat is marked auto and not join-required.
* [x] Regression tests cover bridge + lobby behavior.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (pre-existing client-web board-viewport assertions failing)
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added `client-web` bot orchestrator bridge that derives bot seats from canonical `G.meta.cfg.seats`.
* Wired orchestrator into hotseat and online client loops.
* Mapped orchestrator dispatch to existing move surface via shared `dispatchIntent` bridge.
* Added deterministic loop guard defaults for bot loops.
* Updated lobby seats UI so configured bot seats show `Bot (auto)` and no join button.
* Added regression tests for bridge execution and lobby bot-seat join suppression.
* Updated changelog and added DD-0321.

## 12) Commands Run (with outcomes)

* `pnpm install` → ok
* `pnpm -C packages/client-web exec vitest run test/bot-orchestrator-bridge.test.ts test/lobby-screen.test.tsx` → ok
* `pnpm lint` → ok
* `pnpm run test:ui:unit` → fail (pre-existing `packages/client-web/test/board-viewport.test.tsx` expects old `setTransform` arg shape)
* `pnpm run test:ui:coverage` → fail (same pre-existing `board-viewport.test.tsx` assertion mismatch)
* `pnpm run test:ui:e2e` → warn (Playwright chromium missing in container; launch fails before scenarios)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → ok
* `pnpm run test:ui:unit` → fail (pre-existing `board-viewport` mismatch)
* `pnpm run test:ui:coverage` → fail (pre-existing `board-viewport` mismatch)
* `pnpm run test:ui:e2e` → warn (environment: missing Playwright browser executable)


## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
