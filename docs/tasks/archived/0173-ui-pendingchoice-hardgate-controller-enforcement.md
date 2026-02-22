# Task 0173 — PendingChoice Hard-Gate: enforce controller lock-down

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0173-ui-pendingchoice-hardgate-controller-enforcement`

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
* GR-005
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Hard-gate is UI-only; legality remains engine-owned via `enumerateLegalIntents(...)`.
* GR-005: No new intents/moves; only restrict existing UI affordances.
* GR-006: When pendingChoice exists, controller prevents drafting/confirming normal moves; only `resolveChoice` dispatch remains.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: `ARCH-03` §PENDING CHOICE
* ARCH: `ARCH-06` §5 PENDING CHOICE (HARD GATE)
* ARCH: `ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` → `commit_policy.pending_choice` (hard_gate + allowed/forbidden actions)
* ARCH: `ARCH-06-UI-INTERACTION-CHECKLIST.md` → Section 6 (PendingChoice Hard-Gate)

---

## 2) Goal

* When `vm.hasPendingChoice === true`, the interaction controller enters `pendingChoiceHardGate` and **structurally blocks** all normal action-session mutation.
* While hard-gated, the controller must not allow:
  * proposing/confirming/canceling a normal draft,
  * starting/changing action modes,
  * parameter selection side-effects.
* `resolveChoice(intent)` remains callable and is the only dispatch path.

---

## 3) Non-Goals

* No UI redesign of ActionDock, Inspector, or Board visuals.
* No engine changes; no rule/spec changes.
* No I18N work.

---

## 4) Inputs

* Contracts:
  * `docs/architecture/ARCH-03-MEASURE-CPU.md`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
* Code:
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  * `packages/client-web/src/ui/interaction/types.ts`
* Tests:
  * `packages/client-web/test/interaction-controller-machine.test.ts`

Existing behavior summary (current):

* `interactionState` is set to `pendingChoiceHardGate` when `G.engine.pendingChoice` exists, but the controller still allows `proposeIntent(...)`, `confirmDraft()`, `setActionMode(...)`, and `selectTile(...)` to mutate UI state.

---

## 5) Outputs

### 5.1 Code

* Update `packages/client-web/src/ui/interaction/useGameInteractionController.ts` to enforce hard-gate:
  * derive `hasPendingChoice` from `vm.hasPendingChoice` (single UI truth) and/or validate against `G.engine.pendingChoice`.
  * when hard-gated:
    * `proposeIntent` is a no-op,
    * `confirmDraft` is a no-op,
    * `setActionMode` is a no-op,
    * `selectTile` does not change selection (inspect disabled) and does not trigger any pinned side effects.
  * on transition into hard-gate, clear any in-progress normal action session state (draft + pinned params + actionMode), without dispatch.

### 5.2 Tests

* Extend `packages/client-web/test/interaction-controller-machine.test.ts`:
  * new test(s) asserting that when `vm.hasPendingChoice === true`:
    * `interactionState === 'pendingChoiceHardGate'`
    * `proposeIntent` does not set `proposedIntent`
    * `setActionMode` does not change `actionMode`
    * `selectTile` does not update `selectedTileId/selectedCoord`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (N/A — UI-only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions.
* UI remains presentation-only.

---

## 7) Invariants (Must remain true)

* Client commits moves only via:
  * `confirmDraft()` → `dispatchIntent(moves, draftIntent)` (normal path)
  * `resolveChoice()` → `dispatchIntent(moves, resolveChoiceIntent)` (pendingChoice path)
* When hard-gated, only the `resolveChoice()` dispatch path is reachable.

---

## 8) Implementation Plan

* [x] Add a single `isHardGate` boolean derived from `vm.hasPendingChoice`.
* [x] Add an effect: when `isHardGate` becomes true, clear normal action-session state (draft + actionMode + pinned params).
* [x] Guard controller mutators:
  * [x] `proposeIntent` returns early if `isHardGate`.
  * [x] `confirmDraft` returns early if `isHardGate`.
  * [x] `setActionModeWithSideEffects` returns early if `isHardGate`.
  * [x] `selectTile` returns early if `isHardGate` (inspect disabled).
* [x] Update/extend `interaction-controller-machine.test.ts` with a pendingChoice hard-gate scenario (update the `useIntentViewModel` mock to include `hasPendingChoice` + `pendingChoice` fields).
* [x] Run: `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [x] While `vm.hasPendingChoice === true`, normal draft building is impossible (no `proposedIntent`, no `actionMode` changes).
* [x] While hard-gated, selection/inspection does not change via `selectTile`.
* [x] `resolveChoice(...)` remains functional.
* [x] `pnpm -C packages/client-web test` passes.

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

* Derived `isHardGate` from `vm.hasPendingChoice` in `useGameInteractionController`.
* Added `useEffect` to clear all transient action state (draft, mode, selection) when entering hard-gate.
* Guarded `proposeIntent`, `confirmDraft`, `setActionMode`, and `selectTile` to return early when hard-gated.
* Updated `interactionState` logic to prioritize `pendingChoiceHardGate` using the new flag.
* Added comprehensive tests in `interaction-controller-machine.test.ts` verifying hard-gate entry, state clearing, and action blocking.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web test interaction-controller-machine.test.ts` - Passed
* `pnpm -C packages/client-web test` - Passed

---

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

