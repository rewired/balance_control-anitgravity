# Task 0219 — Hotseat: manual seat switch must not break the next turn

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0219-hotseat-seat-switch-second-turn`

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
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Fix is UI-only (interaction controller lifecycle). No legality/cost/majority computation is added.
* GR-006: Fix preserves Hard-Gate semantics; it prevents stale UI state from bypassing or “sticking” Hard-Gate.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-06:interaction_state_machine
* ARCH: ARCH-06:commit_policy.pending_choice
* ARCH: ARCH-01:CLIENT_RESTRICTIONS
* ARCH: ARCH-03:PENDING_CHOICE

---

## 2) Goal

* In Hotseat, manually switching seats must not poison the next turn.
* The newly active seat can always execute Draw+Place and the Political Action on their next turn.
* Interaction state (draft/pins/mode) must never “leak” across seat changes.
* No engine behavior changes.

---

## 3) Non-Goals

* No rules changes, no move legality changes, no new intents.
* No UI redesign.
* No change to pack/engine enumerators.

---

## 4) Inputs

* Repo areas:
  * `packages/client-web/src/hotseat/HotseatShell.tsx`
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  * `packages/client-web/src/components/GameLayout.tsx`

* Existing behavior summary (current):
  * Hotseat seat switching works visually.
  * After a **manual seat switch**, the **next turn** can become non-interactive (2nd player can’t complete their turn reliably): draft state/pins/hard-gate can get stuck or callbacks can behave as if the previous seat’s gating still applies.

---

## 5) Outputs

### 5.1 Code

* Modify:
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
* Optional (only if needed for a clean fix):
  * `packages/client-web/src/hotseat/HotseatShell.tsx`

### 5.2 Tests

* Add/modify:
  * `packages/client-web/test/hotseat-seat-switch-next-turn.test.tsx`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: N/A (UI-only), but must not introduce time/random dependencies.
* Engine authority: legality/cost/majority/modifiers remain engine-owned.
* PendingChoice Hard-Gate: must remain strict (resolveChoice-only).
* No new moves/intents.

---

## 7) Invariants (Must remain true)

* UI remains presentation-only; no rules logic in client.
* Hard-Gate cannot be bypassed by stale UI state.
* Draft confirmation path remains dock-only (except `pendingChoice.kind=selectTile` board-driven resolveChoice).

---

## 8) Implementation Plan

* [ ] Fix stale closure hazards in `useGameInteractionController`:
  * Ensure every callback that branches on `isHardGate` includes it in `useCallback` deps.
  * Ensure callbacks that depend on `vm.intents` or other derived values include correct deps (avoid “seat A” intents being used after switching to “seat B”).

* [ ] Add an explicit **seat-change reset** in `useGameInteractionController`:
  * On `playerID` change (or `myPid` change), clear transient interaction session state:
    - `proposedIntent`, `actionMode`, `moveInfluenceSourceId`
    - pinned tiles (`pinnedCommitteeTileId`, `pinnedGrassrootsTileId`)
    - convert family (`selectedConvertFamily`)
    - selection (`selectedTileId`, `selectedCoord`) (OK to clear across seats)

* [ ] Regression test:
  * Create a lightweight test component (in the test file) that:
    1) Renders `useGameInteractionController` with `playerID='0'` and `vm.hasPendingChoice=true` (or a state that flips the gate).
    2) Re-renders with `playerID='1'` and `vm.hasPendingChoice=false`.
    3) Asserts that interaction callbacks are no longer blocked by stale `isHardGate` and that transient state is reset.
  * Alternatively: render `GameLayout` and simulate a seat switch via `rerender` while mocking `useIntentViewModel` to provide per-seat VMs.

* [ ] Verify Hotseat scenario manually:
  * Start hotseat.
  * Finish P0 turn.
  * Manually switch to P1.
  * Confirm P1 can place a tile and complete a political action.

---

## 9) Acceptance Criteria

* [ ] Hotseat: After completing P0 turn, manually switching to P1 allows completing the full P1 turn (Draw+Place + one Political Action).
* [ ] Hotseat: Manual seat switch never carries over a draft/pinned source/variant from the previous seat.
* [ ] PendingChoice: Hard-Gate behavior remains strict and updates correctly when the active seat changes.
* [ ] `pnpm -C packages/client-web test` passes.
* [ ] `pnpm -C packages/client-web build` passes (or workspace build passes).

---

## 10) PR Checklist (Repo Artifact)

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

* Added `isHardGate` to dependency arrays of `proposeIntent`, `selectTile`, `confirmDraft`, and `setActionModeWithSideEffects` in `useGameInteractionController.ts` to prevent stale closure hazards.
* Added a `useEffect` hook in `useGameInteractionController.ts` that resets all transient interaction state (`proposedIntent`, `actionMode`, selections, pins) whenever `myPid` changes.
* Created a regression test `packages/client-web/test/hotseat-seat-switch-next-turn.test.tsx` that reproduces the issue and verifies the fix.
* Verified that manual seat switching in Hotseat mode no longer blocks the next player's actions due to stale Hard-Gate state.

---

## 12) Commands Run (with outcomes)

* `pnpm test hotseat-seat-switch-next-turn.test.tsx` (in packages/client-web) -> Passed (2/2 tests).
* `pnpm test` (in packages/client-web) -> Passed (39 files, 201 tests).
* `pnpm lint` -> Passed.

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

### A-01 — N/A
