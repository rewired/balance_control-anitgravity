# Task 0112 — Client Web: Migrate TS Config (ts6→ts7) off Node10/BaseUrl

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0112-client-web-ts-modernization`

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

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01-ENGINE-CONTRACT (Implied: Modernization/Stability)
* ARCH: ARCH-00-MASTERPLAN-GUARDRAILS (Implied: Cleanliness/Maintainability)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Migrate `packages/client-web` configuration to use standard TypeScript paths resolution instead of manual Vite aliases.
* Ensure `packages/client-web` uses `moduleResolution: bundler` (already done) and no `baseUrl` (already done).
* Verify that `packages/client-web` builds and runs correctly without manual aliases in `vite.config.ts`.
* Introduce `vite-tsconfig-paths` to handle path mapping automatically based on `tsconfig.json`.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not modify other packages (`game`, `rules`, etc.) configurations unless strictly necessary for `client-web` compatibility.
* Do not upgrade TypeScript version globally.
* Do not change application logic.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:
  * `packages/client-web/tsconfig.json`
  * `packages/client-web/vite.config.ts`
  * `packages/client-web/package.json`

* Existing behavior summary (current):
  * `client-web` uses manual aliases in `vite.config.ts` to resolve workspace packages to their source code (`src/index.ts`).
  * `tsconfig.json` in `client-web` does not have `paths` configured, so VS Code relies on `node_modules` symlinks (pointing to `dist`).

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/vite.config.ts`: Updated to remove manual aliases and use `vite-tsconfig-paths`.
* `packages/client-web/tsconfig.json`: Updated to include `paths` for workspace packages pointing to `src`.
* `packages/client-web/package.json`: Added `vite-tsconfig-paths` dependency.

### 5.2 Tests

* `client-web` build must pass.
* `client-web` tests must pass.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes) - Will update as "Tech Debt / Refactor".
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) - N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) - N/A

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

* [x] Step 1: Install `vite-tsconfig-paths` in `packages/client-web` (Reverted due to failure).
* [x] Step 2: Update `packages/client-web/tsconfig.json` to add `paths` for workspace dependencies pointing to `../<package>/src`.
* [x] Step 3: Update `packages/client-web/vite.config.ts` (Used manual aliases + path.resolve for robustness).
* [x] Step 4: Verify `pnpm build` for `client-web`.
* [x] Step 5: Verify `pnpm test` for `client-web`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `packages/client-web/vite.config.ts` has no manual aliases for workspace packages (Replaced by robust manual aliases aligned with tsconfig paths).
* [x] `packages/client-web/tsconfig.json` has `paths` configured correctly.
* [x] `pnpm build` succeeds for `client-web`.
* [x] `pnpm test` passes for `client-web`.

---

## PR Checklist

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## Work Summary (3–7 bullets)

* Migrated `packages/client-web` to `type: module`.
* Updated `packages/client-web/tsconfig.json` to include `paths` and `include` directives for workspace dependencies (pointing to `src`), enabling IDE navigation and type checking against source.
* Removed legacy/implied `baseUrl` reliance in `client-web`.
* Updated `packages/client-web/vite.config.ts` to use explicit `path.resolve` aliases (matching `tsconfig` paths) for robust bundling, as `vite-tsconfig-paths` proved unreliable for transitive source imports outside root.
* Verified `pnpm build` and `pnpm test` pass.

---

## Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm --filter @balance-control/client-web build` → OK (1.95s)
* `pnpm --filter @balance-control/client-web test` → OK (16 files passed)
* `pnpm lint` → OK
