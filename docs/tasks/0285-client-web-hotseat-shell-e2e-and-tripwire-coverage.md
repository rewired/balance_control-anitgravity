# Task 0285 — Client-web HotseatShell E2E + tripwire coverage

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0285-hotseat-shell-e2e-tripwire-coverage`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-006
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-006: Added tests for E2E `pendingChoice` injection/clearing through `HotseatShell` hooks, validating hard-gate plumbing remains explicit and deterministic.
* GR-014: Scope is client-web tests and docs only; icon mapping/presentation contracts are untouched.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (no engine-rule semantics changed)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 §5 (PendingChoice hard gate), ARCH-06 §3 (single command path / presentation-only UI)

---

## 2) Goal

* Raise branch/line coverage for `HotseatShell.tsx` by exercising currently uncovered E2E hook and tripwire branches.
* Keep behavior deterministic and presentation-only while testing debug and E2E-only surface APIs.
* Document the coverage-focused decision and traceability artifacts.

---

## 3) Non-Goals

* No changes to authoritative game rules or move legality logic.
* No visual styling/layout changes in production UI.
* No changes to server/lobby/multiplayer protocols.

---

## 4) Inputs

* `packages/client-web/src/hotseat/HotseatShell.tsx`
* `packages/client-web/test/hotseat-shell.smoke.test.tsx`
* `docs/testing/frontend-qa.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* Bound to runbook: YES (`docs/testing/frontend-qa.md`)

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/test/hotseat-shell.smoke.test.tsx`

### 5.2 Tests

* `packages/client-web/test/hotseat-shell.smoke.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0285-hotseat-shell-coverage-branches.md` created (requested documentation trace)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism preserved (tests use deterministic fixture state, no time-based randomness).
* Engine authority preserved (no client rule calculations introduced).
* No phantom moves introduced.

---

## 7) Invariants (Must remain true)

* `HotseatShell` remains presentation-only bridge to boardgame.io client state.
* PendingChoice hook mutation paths are test-only (`__BC_ENABLE_E2E_HOOKS__`) and do not alter production flow.
* Tripwire mismatch indicator appears only via explicit callback and DEV gate.

---

## 8) Implementation Plan

* [x] Extend hotseat shell smoke test board stub to trigger tripwire mismatch callback.
* [x] Add tests for E2E hook methods: `getPendingChoiceKind`, `setPendingChoice`, and `clearPendingChoice` across normal/fallback/no-engine states.
* [x] Add regression test proving DESYNC badge rendering path after mismatch callback.
* [x] Update changelog + DD + task artifact.

---

## 9) Acceptance Criteria

* [x] Previously uncovered E2E hook branches in `HotseatShell.tsx` are covered by unit tests.
* [x] DESYNC badge rendering path is explicitly tested.
* [x] Frontend QA runbook commands executed in mandatory order and recorded.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes (via `pnpm run test:ui:unit` and `pnpm run test:ui:coverage`)
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`) (E2E executed; fails unrelated to this task scope)

---

## 11) Work Summary (3–7 bullets)

* Added board-stub trigger path so `HotseatShell` tripwire mismatch callback can be asserted in tests.
* Added E2E hook behavior tests for pending choice read/set/clear flows with deterministic state fixtures.
* Added fallback assertions for missing `ctx.currentPlayer` (active seat fallback) and monotonic injected choice IDs.
* Added no-engine guard-path test to ensure mutation APIs no-op safely.
* Added changelog, DD, and task artifacts for traceability.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS (46 files, 264 tests).
* `pnpm run test:ui:coverage` → PASS (thresholds met; `HotseatShell.tsx` 99.01% lines / 96.22% branches).
* `pnpm run test:ui:e2e` → FAIL (existing ARCH-06 and board-viewport Playwright specs failing in this environment/repo baseline after browser install).
* `pnpm exec playwright install --with-deps chromium` → PASS (installed missing Chromium runtime + system deps before re-running E2E).

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS (46 files, 264 tests).
* `pnpm run test:ui:coverage` → PASS (thresholds met; `HotseatShell.tsx` 99.01% lines / 96.22% branches).
* `pnpm run test:ui:e2e` → FAIL (existing ARCH-06 and board-viewport Playwright specs failing in this environment/repo baseline after browser install).
* `pnpm exec playwright install --with-deps chromium` → PASS (installed missing Chromium runtime + system deps before re-running E2E).

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

### 13.1 Recorded

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in `Postflight:` block.

### 14.1 Recorded

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only after FROZEN)

* N/A
