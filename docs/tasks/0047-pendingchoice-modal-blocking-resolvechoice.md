# Codex Task 0047 - PendingChoice Modal: Block Until Resolved (No UX Dead Ends)

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- PendingChoice determinism: Task 0009
- Intent-driven UI: Tasks 0026-0028
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5

---

## Goal

When the engine requires a choice, the UI must:

- make the choice unavoidable (modal overlay)
- show only legal `resolveChoice` intents
- dispatch `resolveChoice` deterministically

This prevents "game feels stuck" moments.

---

## Inputs

- `intents` may include moveType `resolveChoice` with payload (selection)
- Current UI renders resolveChoice as just another button (easy to miss)
- `GameLayout` has access to `intents` and `moves`

---

## Outputs

### A) Add blocking modal component

Add: `packages/client-web/src/components/PendingChoiceModal.tsx`

Behavior:

- Render only when `intents` includes at least one `resolveChoice`
- Show title "Decision required"
- Render the choice buttons ordered deterministically:
  - stable sort by payload JSON string (or an explicit key)
- Clicking a choice calls `moves.resolveChoice(payload)` exactly once
- Overlay blocks other interactions (pointer-events) while visible

### B) Integrate into GameLayout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Render `PendingChoiceModal` above the board and panels.
- While modal is visible:
  - disable or hide `ActionPanel` (Task 0046) so no other moves can be dispatched

### C) CSS

Update `packages/client-web/src/index.css`:

- Modal overlay (centered card, backdrop blur/dim)
- Clear focus/hover states for choice buttons

### D) Tests

Add RTL tests:

- Given resolveChoice intents, modal appears.
- While modal visible, other control buttons are disabled or not present.
- Clicking a choice calls `moves.resolveChoice` with the correct payload.

### E) Bookkeeping

- Add this file: `docs/tasks/0047-pendingchoice-modal-blocking-resolvechoice.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0047)
- Update `CHANGELOG.md` (Unreleased):
  - Client: PendingChoice modal blocks play until resolveChoice is dispatched.

---

## Constraints

- No new choice semantics in UI. Only render the legal intents from the engine.
- Deterministic ordering required.
- No engine changes.

---

## Invariants

- While PendingChoice exists, UI must not dispatch other moves.
- No changes to legality logic.

---

## Acceptance Criteria

1. Any pending choice is immediately obvious and resolvable.
2. No "where do I click now?" dead-ends.
3. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Add `PendingChoiceModal` component
- [ ] Wire modal into `GameLayout` as blocking overlay
- [ ] Disable/hide other controls while modal visible
- [ ] Tests for modal visibility + dispatch + blocking behavior
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
