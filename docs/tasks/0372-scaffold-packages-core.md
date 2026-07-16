# Task 0372 — Scaffold `packages/core` Workspace Package

**Date:** 2026-07-16
**Owner:** Claude (Sonnet 5)
**Branch:** `task/0366-core-extraction-root-pack-contract`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

- NONE (mechanical package scaffolding; no engine logic added or changed — placeholder barrels only)

### compliance_notes

- N/A

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366, corrected in this task), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (infrastructure/tooling)
- ARCH: DD-0366 (root-pack contract; Decision 4 corrected in this task)

## 2) Goal

- Create `packages/core` as a real pnpm workspace package, structurally mirroring `packages/expansion-01/02/03` (`package.json` with `exports` for `.`/`./engine`/`./ui`, `tsconfig.json`, `src/index.ts`, `src/engine/index.ts`, `src/ui/index.ts`, `test/pack-integrity.test.ts`).
- Correct a factual error discovered in DD-0366 Decision 4 before wiring the dependency: expansion-01/02/03 do **not** depend on `@balance-control/game` (they're pure `ExpansionDefinition`-shaped content; `packages/packs/src/exp01/02/03.ts` is the actual adapter layer that imports `@balance-control/game`). CORE's content is far more engine-coupled than the lightweight expansions (turn structure, legal-intent enumeration, resolver atoms — no meaningful "pure data" form), so `packages/core` depends directly on `@balance-control/game`, playing the combined role of "pure content" and "adapter" that `packages/packs` plays for expansions.

## 3) Non-Goals

- Does not move any CORE logic into the new package yet (Task 0373). `src/engine/index.ts`/`src/index.ts`/`src/ui/index.ts` are placeholders (`export {}` / `export const UI = {}`) at this stage.
- Does not touch any file under `packages/game` (pure package addition).

## 4) Inputs

- `packages/expansion-01/package.json`, `tsconfig.json`, `src/index.ts`, `src/ui/index.ts`, `test/pack-integrity.test.ts` (structural template)
- `packages/packs/src/exp01.ts` (revealed the real expansion/adapter split, prompting the DD-0366 correction)
- `pnpm-workspace.yaml` (`packages/*` glob — new package auto-discovered, no config change needed)

## 5) Outputs

### 5.1 Code

- `packages/core/package.json` — name `@balance-control/core`, `dependencies`: `@balance-control/rules`, `@balance-control/game` (workspace:*); `exports` for `.`/`./engine`/`./ui`; `pretest` builds `rules` → `shared` → `game` (core's own future content will need all three)
- `packages/core/tsconfig.json` — mirrors expansion-01's, with an added `@balance-control/game` path mapping
- `packages/core/src/index.ts`, `src/engine/index.ts`, `src/ui/index.ts` — placeholder barrels
- `packages/core/test/pack-integrity.test.ts` — placeholder smoke test (module loads); gains real assertions (pack id, manifest, moves, atoms, turn/endIf/playerView/enumerateIntents/updateStats) in Task 0373 once `CorePack` physically lands here
- `docs/design-decisions/DD-0366-core-extraction-root-pack-contract.md` — corrected Decision 4 (see Goal above)
- `pnpm-lock.yaml` — updated by `pnpm install` to register the new workspace member

### 5.2 Tests

- `packages/core/test/pack-integrity.test.ts` (new, placeholder)

### 5.3 Docs

- DD-0366 correction (see above). Full changelog entry deferred to Task 0375.

## 6) Constraints (Hard)

- N/A — no engine logic in this task.

## 7) Invariants (Must remain true)

- N/A — no runtime behavior exists in the new package yet.

## 8) Implementation Plan

- [x] Step 1: Read `expansion-01`'s full structural template (package.json, tsconfig.json, barrels, pack-integrity test).
- [x] Step 2: Discover (via `packages/packs/src/exp01.ts`) that expansions don't depend on `@balance-control/game`, correct DD-0366 Decision 4 accordingly, and decide CORE depends on `@balance-control/game` directly (documented rationale in the DD).
- [x] Step 3: Scaffold `packages/core` per the template, adapted for the `@balance-control/game` dependency.
- [x] Step 4: `pnpm install` to register the new workspace member (13 workspace projects, up from 12).
- [x] Step 5: Build and test the new package in isolation, then the full workspace (`pnpm -r build`), then the full `audit:spec` gate.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/core build` succeeds.
- [x] `pnpm -C packages/core test` — 1/1 file, 1/1 test passes (placeholder smoke test).
- [x] `pnpm -r build` — all 10 packages with a build script (incl. the new `packages/core` and `client-web`) build successfully.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] `git status` shows only the new `packages/core/**` files, the DD-0366 correction, and `pnpm-lock.yaml` — no unintended changes to any existing package.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed (NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes (N/A — infra/tooling)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (not applicable — no pack logic added yet)
- [ ] `pnpm lint` — no dedicated lint script; `tsc` build is the enforced gate
- [x] `pnpm test` (`pnpm -C packages/core test`) passes
- [x] Determinism verified — N/A, no runtime logic in this task
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Scaffolded `packages/core` as a real, buildable, testable pnpm workspace package, structurally matching `expansion-01/02/03`'s shape.
- Discovered during scaffolding that DD-0366's Decision 4 contained a factual error (claimed CORE's dependency on `@balance-control/game` mirrors the expansions — it does not; expansions are dependency-free "pure content," adapted separately by `packages/packs`). Corrected the DD in place with a documented rationale for why CORE legitimately deviates from that pattern (it has no meaningful "pure data" form, unlike the lightweight expansions).
- Verified the new package builds and tests cleanly in isolation and as part of the full workspace, with zero impact on any existing package.

## 12) Commands Run

- `pnpm install` → ok (13 workspace projects registered, up from 12)
- `pnpm -C packages/core build` → ok
- `pnpm -C packages/core test` → ok (1 file, 1 test)
- `pnpm -r build` → ok (all packages incl. client-web)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
