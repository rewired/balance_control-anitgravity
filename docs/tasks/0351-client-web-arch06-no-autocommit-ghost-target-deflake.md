# Task 0351 — Deflake ARCH-06 no-autocommit ghost target selection

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `work`

---

**Task State:** COMMIT_READY

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-014:
  * Änderungen betreffen nur E2E-Orchestrierung und Selektor-/Wait-Strategie im Client-Test.
  * Keine Änderung an Engine-Regelausführung, Legality-Berechnung, Kosten oder Mehrheit.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD absent, TDD present (this task file), AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (E2E-Stabilisierung, keine Regeländerung)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 UI-Interaktionsvertrag (Confirm nur nach expliziter Aktion), ARCH-01:CLIENT_RESTRICTIONS

## 2) Goal

* Flaky Locator-Fehler bei `hex-ghost-*` im Test `arch06-no-autocommit-confirm` eliminieren.
* Vor Ghost-Interaktion explizite Readiness-Bedingungen validieren.
* Zielauswahl robust und deterministisch machen (Count-Polling + stabile Auswahl).

## 3) Non-Goals

* Keine Änderung der Spielregeln oder Engine-Moves.
* Keine Änderung an Hotseat-Runtime-Logik außerhalb des Tests.

## 4) Inputs

* Repo areas:
  * `e2e/client-web/arch06-no-autocommit-confirm.spec.ts`
  * `docs/testing/frontend-qa.md`
* Existing behavior summary (current):
  * Test nutzte globalen CSS-Locator und klickte blind `.first()`.
  * Ghost-Rendering konnte zeitlich variieren und führte zu Flakes.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` applies.

## 5) Outputs

### 5.1 Code

* `e2e/client-web/arch06-no-autocommit-confirm.spec.ts`

### 5.2 Tests

* `e2e/client-web/arch06-no-autocommit-confirm.spec.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

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

* [x] Step 1: Add explicit board-readiness wait before any ghost target interaction.
* [x] Step 2: Replace `.first()` targeting with count polling and deterministic target test-id selection.
* [x] Step 3: Re-run the affected Playwright spec with repeat to confirm flake reduction.

## 9) Acceptance Criteria

* [x] Test waits for hotseat/board readiness before scanning legal ghost targets.
* [x] Test uses scoped/test-id driven target selection instead of global first-match click.
* [x] Repeated Playwright run of affected spec passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash) — N/A (engine untouched)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added `waitForBoardReady` helper to assert active seat/current player readiness before target lookup.
* Added `clickStableLegalGhostTarget` helper that polls legal ghost count and chooses a deterministic target test-id.
* Scoped ghost locator to `hex-board` container and avoided global selector/fragile `.first()` usage.
* Re-ran the affected Playwright spec with `--repeat-each` to validate deflake intent.

## 12) Commands Run (with outcomes)

* `pnpm lint` → pass.
* `pnpm exec playwright test e2e/client-web/arch06-no-autocommit-confirm.spec.ts --repeat-each=5` → initial FAIL (missing Playwright browser binary).
* `pnpm exec playwright install chromium` → pass (browser binaries installed).
* `pnpm exec playwright install --with-deps chromium` → pass (system libs installed for headless chromium).
* `pnpm exec playwright test e2e/client-web/arch06-no-autocommit-confirm.spec.ts --repeat-each=7` → FAIL (intermittent readiness mismatch during seat alignment; informed final helper hardening).
* `pnpm exec playwright test e2e/client-web/arch06-no-autocommit-confirm.spec.ts --repeat-each=5` → pass (5/5).
* `pnpm test` → fail due pre-existing unrelated game test (`packages/game/test/new-core-settlement-endgame-obligations.test.ts`).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS
* `pnpm run test:ui:unit` → N/A (scope is targeted e2e deflake; focused rerun used)
* `pnpm run test:ui:coverage` → N/A (scope is targeted e2e deflake; focused rerun used)
* `pnpm run test:ui:e2e` → N/A (used targeted Playwright repeat command for scoped flaky spec verification)

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

* N/A
