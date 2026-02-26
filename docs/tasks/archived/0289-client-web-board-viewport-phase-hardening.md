# Task 0289 — Harden board viewport E2E flow with explicit lobby and viewport phases

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0289-board-viewport-phase-hardening`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-014: Scope is limited to Playwright E2E synchronization and diagnostics around viewport presentation test IDs/data attributes.
* GR-014: No client runtime behavior, icon mapping, or engine rule semantics were changed.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (E2E timing/diagnostics only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06-UI-INTERACTION-CONTRACT.md (robust deterministic interaction verification)

## 2) Goal

* Split `board-viewport` E2E flow into robust phases for (1) match creation readiness and (2) viewport transform interaction stability.
* Assert baseline transform attributes are initialized before zoom/pan operations.
* Improve poll failure diagnostics with transform snapshot details (`scale`, `tx`, `ty`, and baseline values).

## 3) Non-Goals

* No production logic changes in client-web.
* No engine/rules/state-model changes.
* No UI visual design changes.

## 4) Inputs

* Repo areas:
  * `e2e/client-web/board-viewport.spec.ts`
  * `docs/changelog.md`

## 5) Outputs

### 5.1 Code

* `e2e/client-web/board-viewport.spec.ts`

### 5.2 Tests

* `e2e/client-web/board-viewport.spec.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (test hardening change documented)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A; no ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A; no rule text change)

## 6) Constraints (Hard)

* Keep the existing scenario semantics (load/fit/zoom/pan/reset).
* After create-match click, wait for both `lobby-match-<id>` and `lobby-join-<id>-0` visibility.
* Ensure baseline attributes are available before viewport action assertions.
* Poll failures must provide actionable transform snapshot diagnostics.

## 7) Invariants (Must remain true)

* Test still validates fit-to-board baseline and reset-to-baseline behavior.
* Test still validates zoom and pan measurable transform changes.
* Console/page errors remain asserted as empty.

## 8) Implementation Plan

* [x] Step 1: Add snapshot helper for current+baseline viewport data attributes.
* [x] Step 2: Add baseline-attribute readiness assertion before interaction phase.
* [x] Step 3: Add lobby match row visibility assertion before join click.
* [x] Step 4: Wrap scale/translation poll assertions with enriched failure context.
* [x] Step 5: Run lint and targeted E2E command; record outcomes.

## 9) Acceptance Criteria

* [x] Match-creation phase explicitly waits for response + match row + join button.
* [x] Viewport phase verifies baseline attributes before zoom/pan.
* [x] Poll failures include transform snapshot diagnostics.
* [ ] Targeted Playwright spec passes in this container (blocked: missing Playwright browser binary).

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (N/A for UI E2E-only scope)
* [ ] Determinism verified (golden replay/state hash) (N/A for test-only UI scope)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)

* Added `readViewportSnapshot` helper to expose current and baseline transform data attributes in one deterministic read.
* Added `assertBaselineAttributesReady` and enforced it before interaction assertions.
* Strengthened lobby phase by asserting `lobby-match-<id>` visibility before waiting/joining seat 0.
* Hardened scale/translation polling by rethrowing with detailed snapshot payloads for faster flake diagnosis.
* Kept the original fit/zoom/pan/reset behavior checks and console error guard intact.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `pnpm exec playwright test e2e/client-web/board-viewport.spec.ts` → FAIL (Playwright browser executable missing in container)

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
