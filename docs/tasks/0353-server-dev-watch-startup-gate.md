# Task 0353 — Server dev watcher startup gate for dist/index.js

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `work`

---

**Task State:** COMMIT_READY

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Change only adjusts server development process startup sequencing.
  * No rule-execution logic moved to client or altered; engine authority unchanged.

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

* CORE: N/A (tooling/dev startup change only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:STATE_AUTHORITY (unchanged), ARCH-01:CLIENT_RESTRICTIONS (unchanged)

## 2) Goal

* Prevent `pnpm dev` startup crash loop in `packages/server` when `node --watch dist/index.js` starts before first TypeScript emit.

## 3) Non-Goals

* No game-rule, resolver, or state-shape changes.
* No production runtime behavior changes outside local dev script startup order.

## 4) Inputs

* `packages/server/package.json`

## 5) Outputs

### 5.1 Code

* `packages/server/package.json`

### 5.2 Tests

* N/A (script-level change validated via command runs)

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created — N/A (non-architectural)
* [ ] `/docs/rules/ERRATA-XXXX.md` created — N/A

## 6) Constraints (Hard)

* Keep `pnpm dev` workflow parallelized across workspace.
* Avoid introducing non-deterministic runtime behavior into game/server logic.

## 7) Invariants (Must remain true)

* Engine remains sole rule executor.
* Server package still launches `dist/index.js` in watch mode after build artifacts exist.

## 8) Implementation Plan

* [x] Update server `dev` script to gate `node --watch dist/index.js` until file exists.
* [x] Verify `pnpm dev` no longer fails at startup due to missing module.
* [x] Run lint and targeted server build checks.

## 9) Acceptance Criteria

* [x] `pnpm dev` no longer emits `Cannot find module .../packages/server/dist/index.js` on clean startup.
* [x] `pnpm lint` passes.
* [x] `pnpm -C packages/server build` passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed + compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (N/A)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or targeted equivalent) passes for touched scope
* [x] Determinism verified (N/A: no engine runtime logic changes)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated

## 11) Work Summary (3–7 bullets)

* Replaced immediate server watch launch with a startup gate that waits for `dist/index.js` to exist.
* Preserved existing `concurrently` + `tsc -w` architecture.
* Verified workspace dev startup now reaches server boot logs instead of module-not-found crash.
* Confirmed lint and server package build pass after script change.

## 12) Commands Run (with outcomes)

* `pnpm dev` → pass (server now waits for first emit and starts cleanly)
* `pnpm lint` → pass
* `pnpm -C packages/server build` → pass

## 13) Postflight Proof (recorded in commit message)

Will be appended in commit message `Postflight:` block after final commit.

## 14) Commit Proof (recorded in commit message)

Will include `git show -1 --stat` output in same `Postflight:` block.

## 15) Amendments (append-only)

* Initial draft.

* Follow-up: switched nested watcher shell from `bash -lc` to `bash -c` so pnpm-injected Node PATH is preserved and `node --watch` resolves in dev subprocesses.
* Validation follow-up: `pnpm lint` passed; `pnpm -C packages/server build` fails in clean state until workspace deps are built; `pnpm -r build` then passed (including server), and `pnpm test` passed workspace-wide.
* Follow-up 2: replaced shell loop (`while [ ! -f ... ]; sleep`) with cross-platform Node bootstrap script `packages/server/scripts/wait-for-dist-watch.cjs` (poll + spawn `node --watch` with inherited stdio), and switched `dev` script to `pnpm node scripts/wait-for-dist-watch.cjs`.
