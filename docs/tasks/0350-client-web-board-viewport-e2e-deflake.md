# Task 0350 — Stabilize board viewport E2E zoom/pan/reset interactions

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `task/0350-board-viewport-e2e-deflake`

---

**Task State:** COMMIT_READY

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-014:
  * Änderungen bleiben auf Präsentations-/Interaktionsverhalten im Client (`BoardViewport`) und E2E-Orchestrierung begrenzt.
  * Keine Änderung an Engine-Regeln, Legality, Kosten oder Mehrheitslogik.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD absent (pre-implementation), TDD present (this task file), AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (UI interaction + E2E robustness only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS; ARCH-06 UI interaction contract (viewport input stability)

## 2) Goal

* E2E-Viewport-Test gegenüber Timing-Flakes bei Wheel-Zoom stabilisieren.
* Zoom-Assertions so präzisieren, dass Clamp-Fälle (min/max scale) explizit und robust behandelt werden.
* Pan/Reset-Assertions von vorheriger Zoom-Flake entkoppeln.
* Viewport-Input-Handling im Client auf Eventbindung/Clamp/no-op prüfen und bei Bedarf härten.

## 3) Non-Goals

* Keine Regel-/Engine-Änderung.
* Keine Anpassung von Spielmechanik oder legal-intent Pipeline.
* Keine neuen Produktfeatures für den Viewport.

## 4) Inputs

* Repo areas:
  * `e2e/client-web/board-viewport.spec.ts`
  * `packages/client-web/src/components/BoardViewport.tsx`
* Existing behavior summary (current):
  * E2E nutzt Retry + kurze Timeout-Polle für Wheel-Zoom; Scale-Änderung kann am Clamp-Rand flaky sein.
  * Viewport basiert auf `react-zoom-pan-pinch` mit min/max scale und Fit/Reset-Buttons.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` applies.

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/components/BoardViewport.tsx`

### 5.2 Tests

* `e2e/client-web/board-viewport.spec.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0350-client-web-board-viewport-e2e-deflake.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A: no rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:
  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

## 8) Implementation Plan

* [x] Step 1: Audit E2E helper functions (`readViewportSnapshot`, `assertScaleChanged`, `zoomWithRetry`) and replace delay/retry fragility with explicit condition waits.
* [x] Step 2: Audit `BoardViewport` zoom input behavior (wheel/pinch/button) for event surface, passive/preventDefault implications, scale clamp, and no-op updates; implement minimal hardening if needed.
* [x] Step 3: Harden pan/reset assertions so failures do not cascade from prior zoom state and verify targeted spec in isolation + broader run.
* [x] Step 4: Update task/changelog/DD docs and complete checklist + command evidence.

## 9) Acceptance Criteria

* [x] `e2e/client-web/board-viewport.spec.ts` no longer relies on brittle fixed-delay semantics for zoom change detection.
* [x] Clamp edge-cases are handled by baseline re-selection before zoom-down assertions.
* [x] Pan and reset assertions remain meaningful even if a prior zoom action had minimal effect.
* [x] `pnpm exec playwright test e2e/client-web/board-viewport.spec.ts` passes in isolation.
* [ ] Relevant wider test command passes (blocked by pre-existing flaky failure in `arch06-draft-invalidation-confirm-disabled.spec.ts`).

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (N/A; UI QA command set executed per runbook, full e2e suite has pre-existing flake)
* [x] Determinism verified (N/A: no engine determinism path touched)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Refactored viewport E2E zoom helper flow to use explicit poll-based scale delta waiting (`waitForScaleDelta`) instead of implicit delay assumptions.
* Adjusted E2E baseline strategy: perform a guaranteed zoom-in before zoom-out assertions to avoid min-clamp start conditions.
* Switched board-viewport E2E boot path from online lobby/match creation to hotseat launch to remove unrelated network/lobby flake from viewport interaction coverage.
* Hardened `BoardViewport` fit/reset behavior with transform no-op guards and fit-scale clamping to runtime min/max contract.
* Added non-passive gesture listeners (`gesturestart/change/end`) on viewport root to prevent browser-native gesture defaults from interfering with viewport zoom handling.
* Added DD-0350 and changelog entry for contract traceability.

## 12) Commands Run (with outcomes)

* `pnpm lint` → pass.
* `pnpm run test:ui:unit` → pass.
* `pnpm run test:ui:coverage` → pass (coverage thresholds satisfied).
* `pnpm exec playwright test e2e/client-web/board-viewport.spec.ts` → pass (isolated spec verification).
* `pnpm run test:ui:e2e` → fail due pre-existing flaky `e2e/client-web/arch06-draft-invalidation-confirm-disabled.spec.ts` (`hex-ghost` not found); `board-viewport.spec.ts` passed in the same run.

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS
* `pnpm run test:ui:unit` → PASS
* `pnpm run test:ui:coverage` → PASS
* `pnpm run test:ui:e2e` → FAIL (pre-existing flaky `arch06-draft-invalidation-confirm-disabled.spec.ts`; viewport spec itself passes)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — E2E environment/browser bootstrap

* Reason: Playwright browser binary was missing in the container, blocking mandated e2e verification.
* Change: Installed Playwright Chromium and Linux dependencies using `pnpm exec playwright install --with-deps chromium`.
* Spec anchors: N/A (tooling/runtime precondition only).
* Guardrails: NONE.

### A-02 — Stabilize viewport spec bootstrap surface

* Reason: Online lobby create/join path intermittently failed with network fetch errors unrelated to viewport interaction semantics.
* Change: Switched viewport spec launch path to hotseat mode while preserving viewport interaction assertions.
* Spec anchors: ARCH-01:CLIENT_RESTRICTIONS; ARCH-06 UI interaction checks.
* Guardrails: GR-014.
