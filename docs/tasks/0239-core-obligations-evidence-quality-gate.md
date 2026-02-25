# Task 0239 — CORE obligations evidence-quality gate

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0239-core-obligations-evidence-quality-gate`

---

**Task State:** COMMIT_READY

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-008

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: audit tooling must remain deterministic and reproducible from repo state.
* GR-008: obligation audit must reject weak “comment-only” evidence for normative rules.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-00-01..CORE-01-10-* (all normative CORE anchors in registry)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT, TECH-01-BIG-PICTURE Appendix A

## 2) Goal

* Add a machine-checkable quality rule: normative obligations require executable evidence (tests/invariants/golden), not file references alone.
* Emit WEAK/SUSPECT signals in audit output to prevent false PASS.
* Keep CORE-only audit path easy to run in CI.

## 3) Non-Goals

* No game logic changes.
* No UI changes.

## 4) Inputs

* Repo areas:
  * scripts/audit-core-obligations.mjs
  * docs/architecture/CORE-01-OBLIGATIONS.json
  * docs/architecture/core-obligations.report.json
* Existing behavior summary (current): audit currently passes when normative entries have any evidence string, even without quality guarantees.

## 5) Outputs

### 5.1 Code

* scripts/audit-core-obligations.mjs

### 5.2 Tests

* scripts/__tests__/audit-core-obligations.test.mjs (or equivalent deterministic script test)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* No implicit rules: if spec does not state it, it does not exist.
* Audit should remain standalone and fast.

## 7) Invariants (Must remain true)

* Identical repo state → identical audit report output.
* No edits to normative CORE text in this task.

## 8) Implementation Plan

* [x] Step 1: Define evidence-quality taxonomy and required minimum for NORMATIVE_* classes.
* [x] Step 2: Implement WEAK/SUSPECT detection in audit script.
* [x] Step 3: Add tests for pass/fail/weak scenarios and document usage.

## 9) Acceptance Criteria

* [ ] Audit fails when normative entry has only source-file evidence and no test/invariant/golden proof.
* [ ] Audit report includes counts for OK/WEAK/SUSPECT/MISSING.
* [ ] `pnpm run audit:core-obligations` remains deterministic and CI-friendly.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)

* Rebound obligation evidence paths from removed `packages/game/src/moves/stages/politicalAction.ts` to the split political-action move modules.
* Updated the targeted obligation bands: `CORE-01-02-17D`, `CORE-01-04-09*`, `CORE-01-04-10..22L.1`, and `CORE-01-08-*`.
* Kept stage/meta obligations tied to canonical engine modules (`legal-intents.ts` / `mechanics-turn.ts`) where applicable.
* Preserved executable evidence coverage by retaining existing test/golden evidence entries for each obligation.
* Re-ran the obligations audit and verified orphan evidence is now zero.

## 12) Commands Run (with outcomes)

* `pnpm run audit:core-obligations` ✅ (passes; quality stats show WEAK/MISSING/SUSPECT = 0)

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>

### A-02 — Political-action evidence rebinding after module split

* Reason: `packages/game/src/moves/stages/politicalAction.ts` was removed; obligation evidence needed rebinding to live modules to avoid stale evidence/orphan signals.
* Change: Updated `CORE-01-02-17D`, `CORE-01-04-09*`, `CORE-01-04-10..22L.1`, and `CORE-01-08-*` evidence paths to `placeInfluence.ts`, `moveInfluence.ts`, `formalizeInfluence.ts`, `convertResources.ts` and kept stage/meta bindings on `legal-intents.ts` / `mechanics-turn.ts` where required.
* Spec anchors: CORE-01-02-17D; CORE-01-04-09..22L.1; CORE-01-08-01..10A.
* Guardrails: GR-003, GR-008.
