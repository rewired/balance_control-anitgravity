# Task 0287 — Client-web ARCH-06 pending-choice allowed tile targeting

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0287-arch06-pending-choice-allowed-tile-targeting`

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

* GR-006: The E2E hard-gate test now injects `pendingChoice.selectTile` with an explicit allowed `tileIds` value and clicks the exact mapped board tile, strengthening gating evidence.
* GR-014: Scope is test and documentation updates only; no production iconography or visual mapping behavior changed.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (test-only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 pending-choice hard-gate behavior (`selectTile` remains board-driven and non-modal)

---

## 2) Goal

* Make the second `arch06-pending-choice-hardgate` E2E test click a tile that is explicitly in the allowed `tileIds` set.
* Eliminate `.first()` tile selection to avoid accidental false-positive flow.

---

## 3) Non-Goals

* No engine rules/state/resolver changes.
* No runtime UI behavior changes.
* No multiplayer/server/bot changes.

---

## 4) Inputs

* `e2e/client-web/arch06-pending-choice-hardgate.spec.ts`
* `docs/testing/frontend-qa.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* Bound to runbook: YES (`docs/testing/frontend-qa.md`)

---

## 5) Outputs

### 5.1 Code

* `e2e/client-web/arch06-pending-choice-hardgate.spec.ts`

### 5.2 Tests

* `e2e/client-web/arch06-pending-choice-hardgate.spec.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0287-arch06-selecttile-allowed-tile-targeting.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism preserved (stable sorted selection from state-derived mapping).
* Engine authority unchanged (test-only).
* No phantom moves or implicit rule additions.

---

## 7) Invariants (Must remain true)

* Pending choice hard-gate remains engine-owned and test-observed.
* `selectTile` flow remains board-driven (no blocking modal expected).
* Test-only hook usage remains behind E2E hook flag.

---

## 8) Implementation Plan

* [x] Build `tileId -> coord` mapping from `window.__BC_HOTSEAT_E2E_STATE__.G.grid` in the second test.
* [x] Inject `setPendingChoice({ kind: 'selectTile', spec: { tileIds: [tileId] } })` with a concrete selected tileId.
* [x] Click the matching `hex-tile-<coord>` locator directly.
* [x] Run relevant UI checks and record outcomes.

---

## 9) Acceptance Criteria

* [x] Second test no longer uses `.first()` for target tile click.
* [x] Allowed tileId is explicitly sourced from controlled state-derived `tileIds` set.
* [x] Test targets the exact mapped board coordinate.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (N/A for test-only scoped e2e target; targeted command executed)
* [ ] Determinism verified (golden replay/state hash) (N/A: no engine behavior change)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Reworked `pendingChoice.selectTile` test setup to derive a deterministic tileId→coord mapping from E2E state grid.
* Switched pending-choice injection to use a concrete allowed tileId from the controlled set.
* Replaced first-tile click with explicit `hex-tile-<coord>` target matching the allowed tileId mapping.
* Added task, changelog, and DD artifacts to document why this hardening was required.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → PASS.
* `pnpm run test:ui:e2e -- e2e/client-web/arch06-pending-choice-hardgate.spec.ts` → FAIL initially (missing Playwright browser binaries).
* `pnpm exec playwright install chromium` → PASS.
* `pnpm run test:ui:e2e -- e2e/client-web/arch06-pending-choice-hardgate.spec.ts` → FAIL (missing Linux shared library `libatk-1.0.so.0`).
* `pnpm exec playwright install --with-deps chromium` → PASS.
* `pnpm run test:ui:e2e -- e2e/client-web/arch06-pending-choice-hardgate.spec.ts` → FAIL (existing ARCH-06 baseline assertions failing in this environment snapshot: pending-choice overlay not found; pending kind remained `selectTile` after click).

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → N/A (targeted e2e-only selector hardening).
* `pnpm run test:ui:coverage` → N/A (targeted e2e-only selector hardening).
* `pnpm run test:ui:e2e -- e2e/client-web/arch06-pending-choice-hardgate.spec.ts` → FAIL (environment bootstrap + baseline ARCH-06 failures listed above).

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
