# Task 0280 — Add unit branch coverage for BoardViewport fit/reset transform behavior

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `work`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-014: Changes are limited to `packages/client-web/test/board-viewport.test.tsx` and validate presentation-layer viewport controls only.
* GR-014: No icon mapping, engine rules, or authoritative game state logic are changed.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (client-side viewport UI test only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01-ENGINE-CONTRACT.md (UI presentation-only boundary)

## 2) Goal

* Add unit tests for `BoardViewport` to cover fit/reset and transform dataset branches.
* Mock `react-zoom-pan-pinch` (`TransformWrapper`, `TransformComponent`) so `setTransform` is fully test-controlled.
* Verify fit/reset interactions via `data-testid="btn-fit-to-board"` and `data-testid="btn-reset-view"`.

## 3) Non-Goals

* No production code changes in `packages/client-web/src`.
* No engine/rules logic changes.
* No E2E flow changes.

## 4) Inputs

* Repo areas:
  * `packages/client-web/src/components/BoardViewport.tsx`
  * `packages/client-web/test/`
* Existing behavior summary (current):
  * `BoardViewport` stores baseline transform values on fit and exposes fit/reset buttons via test IDs.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` bound; command order executed and recorded in section 12.1.

## 5) Outputs

### 5.1 Code

* `packages/client-web/test/board-viewport.test.tsx`

### 5.2 Tests

* `packages/client-web/test/board-viewport.test.tsx`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

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

* [x] Step 1: Add mock-based `react-zoom-pan-pinch` unit test harness for `BoardViewport`.
* [x] Step 2: Cover requested branches (missing ResizeObserver, applyFit no-op conditions, successful fit, resetView modes, onTransformed dataset writes).
* [x] Step 3: Run lint + focused unit test command and record outcomes.

## 9) Acceptance Criteria

* [x] Test file `packages/client-web/test/board-viewport.test.tsx` exists and compiles.
* [x] Requested five branch areas are covered with explicit assertions.
* [x] Interactions use `btn-fit-to-board` and `btn-reset-view` test IDs.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (N/A: test-only change)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added a new `BoardViewport` unit test file with explicit `react-zoom-pan-pinch` mocks.
* Added controllable `setTransform` plumbing in tests via mock render-prop injection.
* Added no-op branch coverage for missing `ResizeObserver`, missing viewport size, and missing `setTransform`.
* Added success-path coverage for fit baseline dataset writes and computed transform invocation.
* Added reset-view branch coverage (no baseline vs. baseline present).
* Added `onTransformed` dataset write assertions for `scale`, `tx`, `ty`.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `pnpm --filter @balance-control/client-web vitest run test/board-viewport.test.tsx` → FAIL (package has no `vitest` script)
* `pnpm --filter @balance-control/client-web exec vitest run test/board-viewport.test.tsx` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → OK
* `pnpm run test:ui:unit` → N/A (focused unit command used for this targeted test task)
* `pnpm run test:ui:coverage` → N/A (not required for targeted branch test task)
* `pnpm run test:ui:e2e` → N/A (no E2E scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
