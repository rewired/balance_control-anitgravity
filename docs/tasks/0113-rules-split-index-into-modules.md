# Task 0113 — Rules: Split packages/rules/src/index.ts into stable modules (no behavior change)

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0113-rules-split-index-into-modules`

---

**Task State:** DRAFT

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

* GR-001
* GR-002
* GR-003
* GR-009
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Only move declarations; do not introduce derived state or runtime caches in @balance-control/rules.
* GR-002: Keep @balance-control/rules free of engine-side executable logic; only types/constants/contracts are allowed.
* GR-003: No randomness or non-deterministic helpers introduced; exports remain pure declarations.
* GR-009: Zone IDs/names semantics remain unchanged; refactor is structural only.
* GR-012: GameConfig shape remains compatible; no silent behavior changes to config normalization.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (structure-only, no rule semantics changed)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:STATE AUTHORITY, ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM, ARCH-05:FORMAT, ARCH-05:CONSISTENT RULE-ID REFERENCES

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Make @balance-control/rules pack-ready by splitting the current monolithic `packages/rules/src/index.ts` into small, domain-focused modules, while preserving the public export surface (same symbol names, same semantics) for all in-repo consumers.

---

## 3) Non-Goals

* No rule logic changes.
* No renames of public exports.
* No removal of legacy exports (deprecations may be added, but symbols must remain).

---

## 4) Inputs

* `/packages/rules/src/index.ts` (current monolith)
* All TypeScript compile-time consumers in `/packages/*` that import from `@balance-control/rules`

---

## 5) Outputs

* New module files under `/packages/rules/src/` (e.g. `ids.ts`, `resources.ts`, `zones.ts`, `tiles.ts`, `objects.ts`, `config.ts`, `manifest.ts`, `engine-contract.ts`).
* Updated `/packages/rules/src/index.ts` as a barrel that re-exports from the new modules.
* Any necessary import path updates inside the rules package (no consumer churn beyond what is unavoidable).

---

## 6) Constraints (Hard)

* Keep `@balance-control/rules` entrypoint stable: consumers continue importing from `@balance-control/rules`.
* No cross-package behavioral changes.
* Keep runtime values identical (e.g. `RULESET_MANIFEST`).
* Keep file encoding UTF-8 (no BOM).

---

## 7) Invariants (Must remain true)

* All exported symbols that existed before still exist after refactor.
* `RULESET_MANIFEST` values remain identical.
* No new runtime dependencies added to `@balance-control/rules`.

---

## 8) Implementation Plan

1. Create new files in `packages/rules/src/` and move code out of `index.ts` by theme:
   - `ids.ts`: `PlayerID`, `ZoneId`, `ExpansionId`.
   - `resources.ts`: `ResourceType`, `CoreResources` (as-is), related helpers.
   - `zones.ts`: `CoreZoneNames`, `Zone`.
   - `tiles.ts`: `TileType`, `Tile`, `GrassrootsConversionMetadata`.
   - `objects.ts`: `RegulationType`, `GameObject`.
   - `config.ts`: `ExpansionFlags`, `PackSelection`, `GameConfig`, `PackManifest*` types.
   - `manifest.ts`: `RulesetManifest`, `RULESET_MANIFEST`.
   - `engine-contract.ts`: `ExpansionDefinition`, `EffectDescriptor`, `MeasureDeckDescriptor`, any engine-facing contracts.
2. Convert `packages/rules/src/index.ts` into a barrel that re-exports from the new modules.
3. Ensure there are no circular imports inside rules (keep modules flat; prefer `import type` where possible).
4. Run TypeScript builds for rules and the workspace (`pnpm -r build`). Fix any downstream type breakage by adjusting the barrel exports (not by editing consumers unless necessary).
5. Run tests and doc checks (`pnpm -r --if-present test`, `pnpm run verify:docs`, `pnpm run verify:packs`).

---

## 9) Acceptance Criteria

* [ ] `pnpm -C packages/rules build` succeeds.
* [ ] `pnpm -r build` succeeds.
* [ ] `pnpm -r --if-present test` succeeds.
* [ ] `pnpm run verify:docs` succeeds.
* [ ] No consumer imports outside `@balance-control/rules` are required as a result of this refactor.
* [ ] `RULESET_MANIFEST` values are unchanged compared to pre-refactor.

---

## 10) PR Checklist (Repo Artifact)

- [ ] I confirmed **Task State = FROZEN** before editing code.
- [ ] I ran `pnpm -r build` and `pnpm -r --if-present test`.
- [ ] I ran `pnpm run verify:docs` and `pnpm run verify:packs` (when applicable).
- [ ] I updated **this task file** with Work Summary + Commands + Proof sections.
- [ ] I added/updated tests to prevent regressions (or noted why not applicable).
- [ ] The working tree is clean (`git status --porcelain` empty).

---

## 11) Work Summary (3–7 bullets)

- TODO

---

## 12) Commands Run (with outcomes)

- TODO

---

## 13) Postflight Proof (recorded in commit message)

- TODO: include command output labels: `git status -sb`, `git diff --stat`, `git show -1 --stat`, and test command(s).

---

## 14) Commit Proof (recorded in commit message)

- TODO

---

## 15) Amendments (append-only)

- (none)
