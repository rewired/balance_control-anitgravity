# Task 0177 — PG-5: Deterministic ordering + canonical keys (Variants / Measures / Other)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0177-ui-deterministic-ordering`
**Skills:** S01 (Repo Scan), S04 (Determinism Guard), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:
  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)

Iteration budget (hard stop): **Max 2 fix cycles** after the first full test run.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002
* GR-005
* GR-006

### compliance_notes
* GR-002: UI only reorders / labels engine-provided `LegalIntent`s; no legality/cost/majority computation added.
* GR-005: No new actions; only stable ordering + stable React keys for already-enumerated intents.
* GR-006: No changes to pendingChoice handling; any new sorting must not surface non-`resolveChoice` intents while hard-gated.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `determinism.sorting.variants`
* ARCH-06: `determinism.sorting.measures`
* ARCH-06: `determinism.sorting.expansions_other`
* ARCH-06: `surfaces.ActionDock.forbidden.direct_commit`
* ARCH-06: `truth.client_must_not.construct_moves_ad_hoc`
* ARCH-01: `CLIENT_RESTRICTIONS` (presentation-only boundary)

---

## 2) Goal

* Make ordering of **Expansions → Other**, **Measure variants**, and **Formalize/Convert variants** deterministic and contract-aligned.
* Replace any unstable payload hashing (`JSON.stringify`) used for sorting/keys with canonical payload serialization.
* Ensure list rendering keys are stable and derived from canonical `(moveType + payload)`.

---

## 3) Non-Goals

* No UI redesign; no new panels beyond ordering/key fixes.
* No i18n infrastructure changes (PG-6).
* No engine/spec/rule changes; no new intent mapping categories.

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/ui/useIntentViewModel.ts`
* `packages/client-web/src/ui/interaction/utils.ts` (`canonicalJsonStringify`)
* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/components/MeasureTray.tsx`
* `packages/client-web/src/ui/interaction/measureHelpers.ts`
* `packages/client-web/src/ui/interaction/formalizeHelpers.ts`
* `packages/client-web/src/ui/interaction/convertHelpers.ts`

### Existing behavior summary (current)
* `vm.political.others` is built from a filter but is **not explicitly sorted**.
* `ActionDock` uses `JSON.stringify(intent.payload)` in `intentSortKey`.
* `MeasureTray` uses array index as React key for buttons.

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/ui/useIntentViewModel.ts`
  * Sort `political.others` by `(moveType, canonicalJsonStringify(payload))` before exposing it.
* `packages/client-web/src/components/ActionDock.tsx`
  * Replace `intentSortKey()` payload key with `canonicalJsonStringify(payload)` (and avoid `JSON.stringify`).
  * Ensure any local sort (if any) also uses canonical payload string.
* `packages/client-web/src/components/MeasureTray.tsx`
  * Replace `key={idx}` with a stable key derived from `(moveType, payload)` (canonical payload string).
  * Keep grouping helper usage unchanged.

### 5.2 Tests
* Add/extend deterministic ordering tests:
  * `packages/client-web/test/action-dock.test.tsx`
    * Add a test that renders multiple “Other” intents and asserts render order is `(moveType, canonical payload)` (no flapping).
  * Add a focused unit test for the viewmodel sorting:
    * either extend an existing file or add `packages/client-web/test/intent-viewmodel-ordering.test.ts`
    * assert `buildIntentViewModel(...).political.others` order is stable and sorted.

### 5.3 Docs
* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — N/A (UI-only ordering/keys)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created — N/A
* [ ] `/docs/rules/ERRATA-XXXX.md` created — N/A

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions.
* No cross-imports outside package exports.

---

## 7) Invariants (Must remain true)

* UI remains presentation-only; no rules logic in client.
* Hard-gate (pendingChoice) behavior unchanged.

---

## 8) Implementation Plan

* [ ] Step 1: In `buildIntentViewModel`, sort `baseOthers` using:
  * primary: `intent.moveType` lexicographic
  * secondary: `canonicalJsonStringify(intent.payload ?? {})`
* [ ] Step 2: In `ActionDock`, change `intentSortKey` to use `canonicalJsonStringify(...)` and keep the key fully deterministic.
* [ ] Step 3: In `MeasureTray`, change keys to stable, canonical `(moveType + payload)` keys (no index keys).
* [ ] Step 4: Add/extend tests for viewmodel ordering + ActionDock “Other” ordering.
* [ ] Step 5: Run `pnpm -C packages/client-web test` and ensure green.

---

## 9) Acceptance Criteria

* [ ] `vm.political.others` is deterministically sorted by `(moveType, canonical payload)`.
* [ ] ActionDock renders “Other” intents in stable order and uses stable keys.
* [ ] MeasureTray uses stable keys (no array index keys).
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No phantom moves introduced
* [x] `pnpm lint` passes
* [x] `pnpm -C packages/client-web test` passes
* [x] No temporary files committed

---

## 11) Work Summary (3–7 bullets)

* Implemented deterministic sorting for `political.others` in `useIntentViewModel` using `canonicalJsonStringify`.
* Updated `ActionDock` to use `canonicalJsonStringify` for intent keys to ensure stability.
* Updated `MeasureTray` to use stable keys derived from canonical payload instead of array indices.
* Enhanced `formalizeHelpers` and `convertHelpers` to sort variants by full canonical payload for strict determinism.
* Added `interactionHelpers.test.ts` to verify deterministic grouping and sorting of variants.
* Added tests in `intentViewModel.test.ts` to verify `political.others` sorting.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → Passed (with TS version warning but no errors)
* `pnpm -C packages/client-web test` → Passed (26 files, 101 tests)

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
