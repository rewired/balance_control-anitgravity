# Codex Task 0046 - Controls v2: Contextual Action Panel (No Button Spam)

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Intent-driven UI: Tasks 0026-0028
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- Turn stages: CORE-01-04 (via ctx.activePlayers)

---

## Goal

Replace the current "list every intent as a button" with a usable control scheme:

- primary action is obvious
- secondary actions are grouped/collapsible
- controls react to stage and selection
- still driven ONLY by legal intents

No new rules. No hiding actions by guessing legality.

---

## Inputs

- `packages/client-web/src/components/Controls.tsx` (current)
- `LegalIntent[] intents` already enumerated
- `GameLayout` already provides `stage`, `selectedTileId`, `stagedTileId`

---

## Outputs

### A) Add ActionPanel component

Add: `packages/client-web/src/components/ActionPanel.tsx`

Props (suggested, adjust as needed):

- `moves`, `isActive`, `stage`, `intents`
- `selectedTileId`, `stagedTileId`

UI requirements:

- Stage header (Draw & Place / Political Action / etc.)
- Primary action slot:
  - In `drawAndPlace`: show staged tile id (if any) + show "Skip placement" if legal
  - In `politicalAction`: show "Place influence" enabled only if there is a matching legal intent for `selectedTileId`
- Secondary actions in a "More actions" disclosure:
  - moveInfluence, formalizeInfluence, convertResources, pass, etc.
- If an action requires selection and none is selected: show disabled + short hint text.

### B) Deterministic grouping and ordering

- Exclude `resolveChoice` here (handled by Task 0047 modal).
- Always render "Pass" and "Skip placement" last (when legal).
- Sort other intents deterministically:
  - group by `moveType`
  - within group, stable sort by a deterministic key (for example JSON string of payload)

### C) Replace current Controls usage

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace the bottom `Controls` bar with `ActionPanel`.
- Keep it compact; it must not cover the board center.

### D) Tests

Add RTL tests:

- With a selected tile that has a matching `placeInfluence` intent, the primary button is enabled.
- Without selection, primary place influence is disabled (and does not dispatch).
- Secondary list shows at least one non-primary intent and clicking dispatches exactly one move.

### E) Bookkeeping

- Add this file: `docs/tasks/0046-controls-v2-contextual-action-panel.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0046)
- Update `CHANGELOG.md` (Unreleased):
  - Client: contextual action panel replaces intent button spam.

---

## Constraints

- No legality computation in UI. Enablement is based on existence of matching legal intents only.
- Do not hide actions by inventing new rules; only group and label.

---

## Invariants

- Every clickable action maps 1:1 to a legal intent payload and calls exactly one `moves.*` function.
- No changes to engine rules.

---

## Acceptance Criteria

1. During play, the controls remain readable and do not explode into 20+ buttons.
2. The primary action is always obvious for the current stage.
3. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Add `ActionPanel` (stage + selection aware)
- [ ] Replace `Controls` with `ActionPanel` in layout
- [ ] Deterministic grouping + ordering of intents (excluding resolveChoice)
- [ ] Tests for enablement + dispatch
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
