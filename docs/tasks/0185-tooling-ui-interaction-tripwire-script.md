# Task 0185 — PG-6 (Optional): UI interaction “tripwire” verifier script

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0185-tooling-ui-interaction-tripwire-script`
**Skills:** S01 (Repo Scan), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: Tooling-only; no runtime changes to game logic or legality.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 Checklist: `1) No Auto-Commit`
* ARCH-06 Checklist: `2) Single Commit Path`

---

## 2) Goal

* Add a fast, grep-based verifier that fails CI early if UI components regress into forbidden commit patterns.

---

## 3) Non-Goals

* This does not replace existing Vitest boundary tests (e.g. `no-direct-commit-shortcuts.test.ts`).
* This does not attempt to detect “all hardcoded strings” (I18N is covered separately).

---

## 4) Inputs

* Existing boundary tests:
  * `packages/client-web/test/no-direct-commit-shortcuts.test.ts`
* Contract checklist enforcement points:
  * `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`

---

## 5) Outputs

### 5.1 Code

* Add `scripts/verify-ui-interaction.mjs` (root-level) that:
  * scans `packages/client-web/src/components/**/*.ts(x)`
  * flags matches for:
    * `dispatchIntent(` (direct calls)
    * `\bmoves\.` (direct boardgame.io move calls)
  * prints **actionable failure messages**:
    * header: `UI interaction tripwire failed (ARCH-06)`
    * each hit: `<relativePath>:<line>:<col> <matchedSnippet>`
    * footer: `Fix: route commits via useGameInteractionController.confirmDraft()/resolveChoice().`
  * exits with code `1` on any violation.

* Add a root script entry:
  * `"verify:ui-interaction": "node scripts/verify-ui-interaction.mjs"`

* Optional hook (choose one, keep it simple):
  * add it to root `test` pipeline right after `check:spec-anchors` to fail fast, OR
  * add it to `lint` pipeline.

### 5.2 Tests

* N/A (the script is its own gate). Keep existing Vitest tests.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated — N/A (tooling)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Deterministic output: stable ordering of file/violation reports.
* No false positives from comments/tests outside `components/`.

---

## 7) Invariants (Must remain true)

* No normal move commits from components.

---

## 8) Implementation Plan

* [ ] Step 1: Implement `scripts/verify-ui-interaction.mjs` with a deterministic directory walk.
* [ ] Step 2: Print violations with file/line info (simple line/column scan is sufficient).
* [ ] Step 3: Add `verify:ui-interaction` script to root `package.json`.
* [ ] Step 4: If hooking into `pnpm test`, ensure it runs before package tests.

---

## 9) Acceptance Criteria

* [ ] `pnpm run verify:ui-interaction` passes on mainline.
* [ ] Introducing a deliberate violation (e.g. `dispatchIntent(...)` in `ActionDock.tsx`) fails with a clear message and points to the offending file/line.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately (GR-002).
* [ ] Normative anchors cited.
* [ ] `pnpm run verify:ui-interaction` passes.
* [ ] If hooked into `pnpm test`, `pnpm test` passes.
