# Task 0073 - Game package: Public selector for tile controller + remove client source import

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0073-game-public-selector-tile-controller`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT -> FROZEN -> IMPLEMENTING -> VERIFYING -> COMMIT_READY -> DONE**

Rules (non-negotiable):

* Before touching code: set **Task State = FROZEN** and complete **Sections 0-9**.
* After FROZEN: **Sections 0-9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do not rewrite earlier sections.
* During IMPLEMENTING/VERIFYING: you may only:

  * check boxes in Section 10
  * fill Sections 11-14 (Work Summary / Commands / Proof)

Iteration budget (hard stop):

* Max 2 fix cycles after the first full test run. If still failing: STOP and report blockers.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-010

### compliance_notes

* GR-002: Client must not import engine source files directly. Any rule-relevant computation used by UI must be accessed via `@balance-control/game` exports.
* GR-010: Add a stable, documented export surface for the minimal selector needed by the client (`selectTileController` or equivalent).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* CORE: CORE-01-05 (control computed by computeMajority)

---

## 2) Goal

Fix the current client-web contract breach:

* client-web currently imports from `packages/game/src/...` (source import)
* this breaks package boundaries and makes builds fragile

Provide a stable export from `@balance-control/game` that allows the UI to render tile control safely without importing internal source files.

---

## 3) Non-Goals

* No change to the computeMajority algorithm.
* No state shape changes.
* No changes to intent enumeration or move legality.

---

## 4) Inputs

Current violating import site:

* `packages/client-web/src/components/HexBoard.tsx`

  - imports `computeMajority` from `../../../game/src/mechanics`

Relevant engine implementation:

* `packages/game/src/mechanics.ts` (computeMajority)
* `packages/game/src/index.ts` (package export surface)

---

## 5) Outputs

### 5.1 Code

A) Add a stable selector export to `@balance-control/game`:

Pick ONE of the following patterns (do not export the entire mechanics module):

* Option 1 (preferred): add `selectTileController(tileId, G)` that returns `string | null`
* Option 2: export `computeMajority` directly (only if Option 1 is not practical)

Implementation lives in `packages/game/src/...` and is exported from `packages/game/src/index.ts`.

B) Refactor client-web to use only the package export:

* Update `packages/client-web/src/components/HexBoard.tsx` to import from `@balance-control/game`.

C) Add a cheap boundary tripwire:

* Add a small script OR test that fails if client-web imports `packages/game/src` directly.

  - Example: grep for `/game/src/` in `packages/client-web/src` in a vitest or node script.
  - Keep it simple and stable.

### 5.2 Tests

* Update / add tests as needed so `pnpm -w test` passes.
* Ensure existing game tests for majority still pass.

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (N/A: internal refactor)
* [ ] `/docs/design-decisions/DD-XXXX-public-game-selectors.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* The export surface must remain small and intentional (no "export * from mechanics").
* No new cross-workspace circular dependencies.
* The boundary tripwire must not be flaky (no reliance on environment-specific paths).

---

## 7) Invariants (Must remain true)

* Majority / controller results are unchanged relative to current behavior.
* Client rendering continues to show control correctly.
* No new rule logic is duplicated in client-web.

---

## 8) Implementation Plan

* [ ] Add `selectTileController` (or export `computeMajority`) and export it from `@balance-control/game`.
* [ ] Update HexBoard import to use the package export.
* [ ] Add boundary tripwire (script/test).
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] No imports from `packages/game/src/*` remain anywhere outside `packages/game`.
* [ ] Client still renders controller / majority marker correctly.
* [ ] Boundary tripwire exists and passes.
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Stable game export added (minimal)
* [ ] Client uses package export only
* [ ] Boundary tripwire added
* [ ] `pnpm -w lint` passes
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes
* [ ] No temporary files

---

## 11) Work Summary (3-7 bullets)

* TODO

---

## 12) Commands Run (exact)

* TODO

---

## 13) Proof (screenshots / logs)

* TODO

---

## 14) Commit Message

Required format:

* Subject: `task(0073): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

---

## 15) Amendments (append-only)

* None
