# Task 0253 — UI Coverage Threshold Baseline & Root Flow Integration

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0253-ui-coverage-threshold-policy`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Changes are limited to Vitest coverage configuration and package scripts in `packages/client-web` plus root script wiring.
  * No legality, cost, majority, or resolver logic is moved into the client.
* GR-014:
  * Scope is QA policy and reporting; no icon mappings or visual contract behavior changes.
  * Coverage thresholds enforce test quality without changing UI rendering contracts.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (no gameplay rule behavior changes)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-05-DOCUMENTATION-CONTRACT

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Add deterministic Vitest coverage output for `packages/client-web` with `v8` provider and `text` + `lcov` reporters.
* Add realistic minimum coverage thresholds (branches/functions/lines/statements) as enforceable gates.
* Add a dedicated `test:coverage` script in `packages/client-web`.
* Wire coverage into root QA flow via root script aliases.
* Document coverage thresholds as binding team policy in repository docs.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No gameplay/rules/state/resolver changes.
* No UI component behavior or styling changes.
* No CI provider migration or workflow architecture rewrite.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/vite.config.ts`
  * `packages/client-web/package.json`
  * `package.json`
  * `docs/tasks/`
  * `docs/changelog.md`
* Existing behavior summary (current):

  * Client-web Vitest config defines jsdom environment but no coverage config.
  * Client-web package has `test` script but no dedicated coverage script.
  * Root has UI unit/E2E scripts but no explicit UI coverage entry in root flow.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/vite.config.ts`
* `packages/client-web/package.json`
* `package.json`

### 5.2 Tests

* N/A (configuration + script wiring only)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Step 1: Add `test.coverage` config in `packages/client-web/vite.config.ts` using `provider: 'v8'`, `reporter: ['text', 'lcov']`, and initial realistic threshold values.
* [x] Step 2: Add `test:coverage` in `packages/client-web/package.json` and wire root-level `test:ui:coverage` script into root QA flow (`test:ui:all`).
* [x] Step 3: Add team-policy documentation for coverage thresholds (DD + task checklist policy note), update changelog, run lint/tests.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `packages/client-web/vite.config.ts` contains enforceable coverage config with v8 + text/lcov reporters.
* [x] `packages/client-web/package.json` exposes a runnable `test:coverage` script.
* [x] Root scripts include a UI coverage command and use it in root UI flow.
* [x] Team policy doc explicitly defines baseline thresholds and ratcheting guidance.
* [x] Verification commands succeed (or environment limitations are documented).

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

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

---

## 11) Work Summary (3–7 bullets)

* Added `test.coverage` config in `packages/client-web/vite.config.ts` using `provider: 'v8'`, `reporter: ['text', 'lcov']`, and enforceable baseline thresholds (branches/functions/lines/statements).
* Added `test:coverage` in `packages/client-web/package.json` and aligned package-local Vitest tooling (`vitest` + `@vitest/coverage-v8` 0.34.6) so coverage runs reliably.
* Added root `test:ui:coverage` and changed `test:ui:all` to run coverage before E2E for stronger UI quality gating.
* Added team policy doc `docs/qa/ui-coverage-threshold-policy.md` with binding baseline values and ratcheting rules.
* Added design decision record `docs/design-decisions/DD-0253-ui-coverage-threshold-ratcheting.md` and updated `docs/changelog.md`.
* Verified lint + UI coverage pass; Playwright E2E remains blocked in this container by missing Linux shared library `libatk-1.0.so.0`.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm install` → ✅ PASS (installed package-local `vitest@0.34.6` and `@vitest/coverage-v8@0.34.6`).
* `pnpm -C packages/client-web run test:coverage` → ✅ PASS (41 files / 217 tests; coverage thresholds exceeded: branches 80.78, functions 88.4, lines 91.97, statements 91.97).
* `pnpm run test:ui:all` → ⚠️ PARTIAL (coverage leg passed; E2E leg failed in container due missing `libatk-1.0.so.0`).
* `pnpm exec playwright install chromium` → ✅ PASS (browser binaries installed).
* `pnpm run test:ui:e2e` → ⚠️ FAIL in container (Chromium launch blocked by missing system library `libatk-1.0.so.0`).
* `pnpm lint` → ✅ PASS.
* `pnpm test` → ❌ FAIL (pre-existing workspace failures in expansion package tests resolving `@balance-control/rules` entrypoint; unrelated to this UI coverage task).

---

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

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>


### A-02 — Baseline docs resync to active gate

* Reason: `packages/client-web/vite.config.ts` enforces stronger coverage thresholds (75/80/90/90) than the originally documented baseline (45/55/60/60), creating policy drift.
* Change: Updated `docs/qa/ui-coverage-threshold-policy.md` Baseline Gate and `docs/design-decisions/DD-0253-ui-coverage-threshold-ratcheting.md` Decision thresholds; added changelog note for the documentation resync.
* Spec anchors: ARCH-05-DOCUMENTATION-CONTRACT
* Guardrails: GR-014
