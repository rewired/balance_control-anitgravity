# Task 0072 - Client-Web: Rebuild intent UI processing (single view-model, no ad-hoc filters)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0072-client-web-intent-ui-processing`

---

**Task State:** COMMIT_READY

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

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

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

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] VM introduced and consumed by UI
* [x] No duplicated intent filtering remains
* [x] No engine changes
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Added `useIntentViewModel` + pure builder to centralize intent grouping for UI.
* Refactored `GameLayout`, `ActionPanel`, `BoardViewport`, `HexBoard`, and `PendingChoiceModal` to consume the VM (no ad-hoc intent filters).
* Removed unused legacy `Controls.tsx`.
* Added deterministic unit tests for VM grouping + updated affected client-web tests.

---

## 12) Commands Run (exact)

* `pnpm -w lint` (ok)
* `$env:NO_COLOR=1; pnpm -w test` (ok)
* `git status` (ok)
* `git diff --stat` (ok)

---

## 13) Proof (screenshots / logs)

### git status

```
On branch task/0072-client-web-intent-ui-processing
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0072-client-web-rebuild-intent-ui-processing.md
	modified:   packages/client-web/src/components/ActionPanel.tsx
	modified:   packages/client-web/src/components/BoardViewport.tsx
	deleted:    packages/client-web/src/components/Controls.tsx
	modified:   packages/client-web/src/components/GameLayout.tsx
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/src/components/PendingChoiceModal.tsx
	modified:   packages/client-web/test/Board.test.tsx
	modified:   packages/client-web/test/action-panel.test.tsx
	modified:   packages/client-web/test/controls-start-committee.test.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/__tests__/
	packages/client-web/src/ui/useIntentViewModel.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### git diff --stat

```
 ...0072-client-web-rebuild-intent-ui-processing.md |  8 +-
 packages/client-web/src/components/ActionPanel.tsx | 90 ++++----------------
 .../client-web/src/components/BoardViewport.tsx    | 20 ++---
 packages/client-web/src/components/Controls.tsx    | 95 ----------------------
 packages/client-web/src/components/GameLayout.tsx  | 29 ++-----
 packages/client-web/src/components/HexBoard.tsx    | 28 ++++---
 .../src/components/PendingChoiceModal.tsx          | 19 ++---
 packages/client-web/test/Board.test.tsx            |  5 +-
 packages/client-web/test/action-panel.test.tsx     | 25 +++---
 .../test/controls-start-committee.test.tsx         |  8 +-
 10 files changed, 78 insertions(+), 249 deletions(-)
```

### $env:NO_COLOR=1; pnpm -w test

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  Test Files  13 passed (13)
packages/client-web test:       Tests  45 passed (45)
packages/client-web test: Done
```

---

## 14) Commit Message

Required format:

* Subject: `task(0072): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

Subject: `task(0072): rebuild intent UI processing via view-model`

Body:

- Centralize client intent grouping in `useIntentViewModel`/`buildIntentViewModel`.
- Refactor intent-consuming components to render from the VM (no ad-hoc filtering).
- Add unit tests for deterministic grouping and update client-web tests for new props.

---

## 15) Amendments (append-only)

* None
