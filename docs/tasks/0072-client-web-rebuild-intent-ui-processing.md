# Task 0072 - Client-Web: Rebuild intent UI processing (single view-model, no ad-hoc filters)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0072-client-web-intent-ui-processing`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT -> FROZEN -> IMPLEMENTING -> VERIFYING -> COMMIT_READY -> DONE**

Rules (non-negotiable):

* Before touching code: set **Task State = FROZEN** and complete **Sections 0-9**.
* After FROZEN: **Sections 0-9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do not rewrite earlier sections.
* During IMPLEMENTING/VERIFYING: you may only:

  * check boxes in Section 10
  * fill Sections 11-14 (Work Summary / Commands / Proof)

Iteration budget (hard stop):

* Max 2 fix cycles after the first full test run. If still failing: STOP and report blockers.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-004

### compliance_notes

* GR-002: Client must not re-implement legality, costs, or prohibitions. The intent UI model is pure presentation over `enumerateLegalIntents` output.
* GR-004: Keep client runtime simple; prefer pure functions + hooks. No new heavy dependencies.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* CORE: CORE-01-04 (turn stages: drawAndPlace, politicalAction)

---

## 2) Goal

Put the entire client-side intent processing on a single, auditable path:

* exactly one place computes:

  - current stage (best-effort)
  - legal intents (already via `enumerateLegalIntents`)
  - intent groupings for UI (tile placement, political action, choice resolution)

* UI components consume a view-model instead of re-filtering intents in multiple places

This is explicitly meant to reduce drift and mysterious special cases in the UI.

---

## 3) Non-Goals

* No engine changes.
* No new gameplay features.
* No redesign of the layout; only refactor intent handling and simplify components.

---

## 4) Inputs

Current intent usage sites (duplication today):

* `packages/client-web/src/components/GameLayout.tsx` (computes stage + intents)
* `packages/client-web/src/components/ActionPanel.tsx` (filters / groups intents with special cases)
* `packages/client-web/src/components/BoardViewport.tsx` and `HexBoard.tsx` (filters placeTile intents for ghosts)

Potential legacy:

* `packages/client-web/src/components/Controls.tsx` (intent filtering; may be unused)

---

## 5) Outputs

### 5.1 Code

A) Add a single hook + pure builder:

* Add: `packages/client-web/src/ui/useIntentViewModel.ts`

  - Uses `useMemo`
  - Input: `{ G, ctx, playerID, selectedTileId, stagedTileId }`
  - Output: a stable object (no functions that close over mutable state unless memoized)

B) Define a minimal view-model shape (example; adjust if needed, but keep small):

* `stage: string | null`
* `intents: LegalIntent[]`
* `hasPendingChoice: boolean`
* `drawAndPlace: { placeTile: LegalIntent[]; passTilePlacement: LegalIntent | null }`
* `political: { placeInfluenceForSelected: LegalIntent | null; others: LegalIntent[] }`
* `ghostCoords: string[]` (derived only from placeTile intents)

C) Refactor components to consume this VM:

* `GameLayout.tsx`: compute VM once and pass down
* `ActionPanel.tsx`: remove ad-hoc filtering; render from VM groupings
* `BoardViewport.tsx` / `HexBoard.tsx`: use `ghostCoords` (or the VM placeTile intents) without re-filtering

D) Remove dead / duplicate code paths:

* If `Controls.tsx` is unused, delete it and adjust imports accordingly.

  - If it is used, refactor it to consume the VM and remove special cases.

### 5.2 Tests

Add unit tests for the pure VM builder (stable grouping, no accidental omission):

* Add: `packages/client-web/src/ui/__tests__/intentViewModel.test.ts`

  - Uses small synthetic intent arrays (no engine simulation required)
  - Proves grouping rules and ordering are deterministic

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (N/A: refactor only)
* [ ] `/docs/design-decisions/DD-XXXX-intent-ui-vm.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* VM must not infer legality beyond what `enumerateLegalIntents` provides.
* Ordering must be stable:

  - if `enumerateLegalIntents` is stable, VM output ordering must remain stable
  - do not use unstable sort / iteration over object keys without sorting

* Keep the VM small; do not create a second rules engine in the client.

---

## 7) Invariants (Must remain true)

* UI remains playable (no missing actions due to filtering errors).
* Pending choice behavior remains correct (choice modal + action disabling).
* No new dependencies.

---

## 8) Implementation Plan

* [ ] Add pure builder + `useIntentViewModel` hook.
* [ ] Refactor GameLayout -> ActionPanel -> BoardViewport / HexBoard to use VM.
* [ ] Remove or refactor legacy `Controls.tsx` to avoid duplicate filtering logic.
* [ ] Add unit tests for grouping stability.
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] There is exactly one place in client-web where intents are grouped for presentation (the VM).
* [ ] ActionPanel no longer contains "business logic" filters (only rendering decisions).
* [ ] Ghost placement rendering uses VM output (no duplicated intent filtering).
* [ ] Client tests pass.
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] VM introduced and consumed by UI
* [ ] No duplicated intent filtering remains
* [ ] No engine changes
* [ ] `pnpm -w lint` passes
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes
* [ ] No temporary files

---

## 11) Work Summary (3-7 bullets)

* TODO

---

## 12) Commands Run (exact)

* TODO

---

## 13) Proof (screenshots / logs)

* TODO

---

## 14) Commit Message

Required format:

* Subject: `task(0072): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

---

## 15) Amendments (append-only)

* None
