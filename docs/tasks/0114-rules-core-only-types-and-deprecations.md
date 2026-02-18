# Task 0114 — Rules: Introduce core-only Resource/Zone types + deprecate expansion leakage

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0114-rules-core-only-types-and-deprecations`

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

* GR-001: Keep shared state contracts JSON-only and declarative; add types/enums only.
* GR-002: Move expansion-specific identifiers out of core-only enums (or mark legacy) to avoid engine/client importing pack knowledge from core.
* GR-003: Only type-level and constant-level changes; no behavioral randomness or time-based logic.
* GR-009: Core zone invariants remain intact; new core-only zone type must match existing usage.
* GR-012: PackSelection remains canonical; ExpansionFlags become compatibility only (no new split-brain).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: SPEC-CORE-01 CORE-01-00 (state shape is authoritative); CORE-01-02 (resources/resorts as identifiers); CORE-01-03 (zones as named containers)
* EXP-01: N/A (migration handled in 0115)
* EXP-02: N/A (migration handled in 0116)
* EXP-03: N/A (migration handled in 0117)
* ARCH: ARCH-01:STATE AUTHORITY, ARCH-01:RULE EXECUTION, ARCH-01:DETERMINISM, ARCH-01:MATCH CONFIG CANONICAL, ARCH-02:STATE SHAPE, ARCH-05:CONSISTENT RULE-ID REFERENCES

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Make `@balance-control/rules` stop pretending that expansion IDs/resources/zones are “core”. Add explicit core-only types and begin deprecating the expansion leakage so packs can become self-contained.

---

## 3) Non-Goals

* No mass migration of all call sites to new types (keep this scoped).
* Do not remove legacy exports yet.
* Do not change game rules/behavior.

---

## 4) Inputs

* `packages/rules/src/*` modules (post-0113 split)
* Existing `CoreResources` / `CoreZoneNames` definitions
* `packages/game/src/config.ts` (canonical config normalization)
* Any unit tests that directly reference deprecated types (only update where necessary).

---

## 5) Outputs

* Core-only identifiers exported from `@balance-control/rules`:
  - `CoreResort` (DOM/FOR/INF)
  - `CoreZoneName` (only true core zones)
  - `ResourceId` (string) or equivalent neutral identifier.
* Legacy `CoreResources` / `CoreZoneNames` retained but annotated `/** @deprecated */` and documented as compatibility-only.
* A single canonical enablement path: `packs.enabledPacks` is canonical; `ExpansionFlags` are compatibility-only and derived/validated.
* Minimal adjustments in `packages/game/src/config.ts` to avoid split-brain when both flags and packs are provided.

---

## 6) Constraints (Hard)

* Preserve backwards compatibility for in-repo consumers (types still compile).
* Do not change JSON shapes already used by saved games unless explicitly required.
* Any new types must be re-exported from `@balance-control/rules` barrel.
* Deprecation must be via comments/tsdoc only (no runtime warnings).

---

## 7) Invariants (Must remain true)

* Existing zone names and IDs continue to function.
* Engine determinism and pack registry order remain unchanged.
* Saved setupData/config parsing continues to accept legacy `expansions.ex01/ex02/ex03` input.

---

## 8) Implementation Plan

1. In `packages/rules/src/resources.ts` (or equivalent), introduce:
   - `export type CoreResort = 'DOM' | 'FOR' | 'INF';`
   - `export type ResourceId = string;`
   - Add `/** @deprecated */` doc to `CoreResources` explaining it includes expansion identifiers for legacy reasons.
2. In `packages/rules/src/zones.ts` (or equivalent), introduce:
   - `export enum CoreZoneName { DrawPile, DiscardFaceUp, Board, Bank, Noise, PersonalSupply, PlayerHand, SelectionStaging }`
   - Add `/** @deprecated */` doc to `CoreZoneNames` explaining it is legacy and contains expansion zones.
3. Update *core-only* engine locations that should not depend on expansion zones/resources (as a minimal start):
   - Prefer `CoreZoneName` in `packages/game/src/setup.ts` where zones are created.
   - Prefer `CoreResort` where only DOM/FOR/INF are valid (when applicable).
4. In `packages/rules/src/config.ts` and `packages/game/src/config.ts`:
   - Document `packs.enabledPacks` as canonical.
   - Keep `ExpansionFlags` but mark deprecated; ensure `normalizeGameConfig()` derives flags from packs (or validates if both specified).
5. Add/adjust tests to ensure:
   - Config normalization does not allow `packs.enabledPacks=['exp01']` while `expansions.ex01=false` (must be reconciled deterministically).
6. Run full build + test matrix.

---

## 9) Acceptance Criteria

* [ ] `pnpm -r build` succeeds.
* [ ] `pnpm -r --if-present test` succeeds.
* [ ] No removal of `CoreResources` / `CoreZoneNames` exports; only additions + deprecations.
* [ ] `normalizeGameConfig()` produces deterministic canonical `packs.enabledPacks` output, even when legacy flags are present.
* [ ] Core setup code no longer needs expansion zone constants for core zones.

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
