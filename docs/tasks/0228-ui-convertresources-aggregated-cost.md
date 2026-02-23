# Task 0228 — UI: Display ConvertResources costs as aggregated (never list token IDs)

**Date:** 2026-02-23
**Owner:** Codex
**Branch:** `task/0228-ui-convertresources-aggregated-cost`

---

**Task State:** COMMIT_READY

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: UI renders intent payload fields only; no legality/cost computation or dedup that changes meaning.
* GR-014: Presentation-only change; keep existing icon mapping stable.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-20
* CORE: CORE-01-04-22J
* ARCH: ARCH-01:CLIENT_RESTRICTIONS
* ARCH: ARCH-06-UI-INTERACTION-CONTRACT

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* ConvertResources variant selection shows compact, meaningful options (output resort + aggregated payment summary).
* ConvertResources UI never renders raw resource token IDs from intent payloads.
* Single-option steps auto-select to reach draft-ready; confirmation remains explicit in the dock.

---

## 3) Non-Goals

* Do not move legality/cost computation into the client.
* Do not introduce new moves/intents or semantic dedup on the client.
* Do not redesign the ActionDock beyond the minimum needed for usability.

---

## 4) Inputs

Concrete starting points: files, existing functions, fixtures.

* Repo areas:

  * `packages/client-web/src/components/ActionDock.tsx`
  * `packages/client-web/src/ui/interaction/convertHelpers.ts`
* Existing behavior summary (current):

  * ConvertResources variants can display raw `inputResourceIds` / `extraResourceIds` values (token IDs), producing unplayable option lists.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/ui/interaction/convertHelpers.ts`

### 5.2 Tests

* `packages/client-web/test/action-dock.test.tsx`
* `packages/client-web/src/ui/__tests__/interactionHelpers.test.ts`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Update ConvertResources grouping to use aggregated fields (e.g. `inputCount`), not token IDs.
* [ ] Update ActionDock ConvertResources selection UI to display aggregated payment summaries only.
* [ ] Auto-select single-option steps (single family and/or single variant) to reach draft-ready.
* [ ] Add/update tests to fail if token IDs leak into ConvertResources UI text.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] ConvertResources UI never displays token IDs (including `RES_*`); shows aggregated payment summaries instead.
* [ ] Options list is bounded by meaningful choices (variant/output), not token supply size.
* [ ] Single-option steps auto-select and proceed to draft-ready; confirm remains explicit in dock.
* [ ] Sorting is stable across reloads/replays for identical state.

---

## 10) PR Checklist (Repo Artifact)

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

## 11) Work Summary (3–7 bullets)

* Stop rendering ConvertResources `inputResourceIds` / `extraResourceIds` token IDs in the ActionDock.
* Group ConvertResources options by output resort and sort variants deterministically by `inputCount`.
* Auto-select single-option ConvertResources steps in the interaction controller (still requires dock confirm).
* Update i18n draft summary so ConvertResources draft preview includes output + aggregated payment.
* Add regression test ensuring `RES_*` never appears in ConvertResources UI text.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm test` → ok

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file.

### 13.1 Recorded

* N/A (not started)

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

* N/A (not started)

---

## 15) Amendments (append-only)
