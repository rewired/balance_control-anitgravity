# Task 0257 — Client-web Hotseat stateID typing build fix

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0257-hotseat-stateid-typing`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Change is limited to `packages/client-web/src/hotseat/HotseatShell.tsx` typing for reading snapshot state IDs.
  * No legality/cost/majority/rules logic is implemented in client.
* GR-014:
  * No iconography or visual mapping changes.
  * No user-facing style or visual contract changes.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (no rules behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-06-UI-INTERACTION-CONTRACT

---

## 2) Goal

* Restore `pnpm -w build` by fixing strict TypeScript errors in hotseat E2E hook state ID read path.
* Keep client scope presentation/testing-only without changing engine authority.

## 3) Non-Goals

* No gameplay/rules/resolver/state-shape changes.
* No UI layout/styling changes.
* No E2E behavior changes beyond type-safe compile compatibility.

## 4) Inputs

* Repo areas:
  * `packages/client-web/src/hotseat/HotseatShell.tsx`
  * `docs/tasks/`
  * `docs/changelog.md`
* Existing behavior summary (current):
  * `getStateID` read `ctx._stateID`/`ctx.stateID` directly and fails TS strict build because `Ctx` type does not define these fields.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* Bound to `docs/testing/frontend-qa.md`.

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/hotseat/HotseatShell.tsx`

### 5.2 Tests

* N/A (compile/type fix only)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0257-hotseat-stateid-typing.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism preserved; no runtime randomness sources introduced.
* Engine authority remains in `packages/game`.
* No phantom moves or implicit rule behavior.

## 7) Invariants (Must remain true)

* UI remains presentation-only.
* Engine state authority unchanged.
* Build remains deterministic under same dependency graph.

## 8) Implementation Plan

* [x] Introduce local snapshot typing helper to read optional state ID fields without relying on `Ctx` private typing.
* [x] Replace inline `getStateID` expression with typed helper call.
* [x] Run build and frontend QA command sequence; record outcomes.
* [x] Update task/changelog/DD docs.

## 9) Acceptance Criteria

* [x] `pnpm -w build` succeeds.
* [x] `packages/client-web/src/hotseat/HotseatShell.tsx` compiles under strict TS without `Ctx` property errors.
* [x] No gameplay logic change is introduced.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added a typed `readStateID` helper in `HotseatShell` to safely read optional state ID fields from client snapshots.
* Replaced the inline `getStateID` expression that referenced missing `Ctx` properties.
* Confirmed workspace build now succeeds, including `packages/client-web` production build.
* Ran frontend QA command sequence and documented environment/test tooling limitations.
* Updated changelog and added DD-0257 for typing-boundary rationale.

## 12) Commands Run (with outcomes)

* `pnpm -w build` → ✅ PASS
* `pnpm lint` → ✅ PASS
* `pnpm run test:ui:unit` → ✅ PASS (41 files, 217 tests)
* `pnpm run test:ui:coverage` → ❌ FAIL (`Failed to load custom CoverageProviderModule from undefined`)
* `pnpm exec playwright install chromium` → ✅ PASS
* `pnpm run test:ui:e2e` → ⚠️ FAIL (container missing system library `libatk-1.0.so.0` for Chromium headless shell)

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → ✅ PASS
* `pnpm run test:ui:unit` → ✅ PASS
* `pnpm run test:ui:coverage` → ❌ FAIL (coverage provider module resolution)
* `pnpm run test:ui:e2e` → ⚠️ FAIL (missing `libatk-1.0.so.0` in container)

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 15) Amendments (append-only)

N/A
