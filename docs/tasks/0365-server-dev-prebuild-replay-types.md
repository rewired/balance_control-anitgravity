# Task 0365 — Server dev prebuild for replay type exports

**Date:** 2026-03-10  
**Owner:** Codex  
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`  
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

- GR-002

### compliance_notes

- GR-002: Change is limited to server development startup scripting and build ordering for workspace type artifacts.
- GR-002: No rule evaluation logic or legality/cost/majority execution paths were changed.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] I applied the missing-class rule where classes are absent.
- [x] Class presence/absence documented: SEC present, DD absent, TDD present, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (tooling/dev-only)
- EXP-01: N/A
- EXP-02: N/A
- EXP-03: N/A
- ARCH: ARCH-01:CLIENT_RESTRICTIONS (unchanged), ARCH-01:STATE_AUTHORITY (unchanged)

## 2) Goal

- Prevent transient/initial `packages/server` TypeScript watch errors caused by stale or missing `@balance-control/game` / `@balance-control/packs` declaration outputs during `pnpm dev` startup.

## 3) Non-Goals

- No runtime server behavior changes.
- No replay schema changes.
- No engine/state/rules changes.

## 4) Inputs

- `packages/server/package.json`

## 5) Outputs

### 5.1 Code

- `packages/server/package.json`

### 5.2 Tests

- Validation via build/test commands only.

### 5.3 Docs

- [x] `/docs/changelog.md` updated
- [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
- [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

## 6) Constraints (Hard)

- Keep server dev workflow cross-platform.
- Keep deterministic engine behavior unchanged.

## 7) Invariants (Must remain true)

- Engine remains sole rule executor.
- Replay logging semantics unchanged.

## 8) Implementation Plan

- [x] Add explicit prebuild step for game/packs before server watch compilation.
- [x] Keep existing dist watcher bootstrap behavior.
- [x] Run workspace-relevant checks.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/server build` succeeds from current workspace state.
- [x] Replay logging tests in server package pass.
- [x] New dev script sequences dependency build before TypeScript watch.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails listed + compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (N/A)
- [x] `pnpm lint` passes
- [x] `pnpm test` (or targeted equivalent) passes for touched scope
- [x] Determinism verified (N/A for tooling-only change)
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated

## 11) Work Summary (3–7 bullets)

- Confirmed reported replay-type export errors do not reproduce after fresh workspace build.
- Identified dev-start race/staleness risk from `packages/server` TS paths pointing at dependency `dist/*.d.ts` outputs.
- Added explicit `dev:deps` prebuild step (`game` + `packs`) before starting server TypeScript watch.
- Kept existing `wait-for-dist-watch.cjs` startup gate intact for `dist/index.js` watch process.

## 12) Commands Run (with outcomes)

- `pnpm -r build` → pass
- `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass
- `pnpm -C packages/server build` → pass
- `pnpm lint` → pass

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message `Postflight:` block.

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message `Postflight:` block including `git show -1 --stat`.

## 15) Amendments (append-only)

- Initial completion.
