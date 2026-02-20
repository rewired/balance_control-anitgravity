# Codex Task 0151 — UI: FormalizeInfluence wizard (select committee → choose payment combo → confirm)

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0151
- **Owner:** Codex
- **Area:** `packages/client-web/src/**`
- **Priority:** P2
- **Risk:** Medium (introduces first multi-step picker for intent-heavy actions)
- **Branch name:** `task/0151-ui-formalize-wizard`
- **Skills:** S07 (UX Consistency), S05 (Boundary Check)

## 1) Guardrails (frozen)

- **GR-002 (Engine-only Rule Execution):** UI filters and selects only from enumerated intents.
- **GR-006 (Pending Choice Gate):** pendingChoice blocks the wizard.
- **GR-005 (No Phantom Moves):** no new moves added.

## 2) Spec anchors (frozen)

- `docs/rules/000-core.md`
  - `CORE-01-04-13..15` (FormalizeInfluence)
  - `CORE-01-08-04` / `CORE-01-08-06` (Start Committee restrictions)
- `docs/architecture/TECH-01-BIG-PICTURE.md` — intents are the only API.
- `packages/game/src/engine/legal-intents.ts`
  - `enumerateFormalize(...)` enumerates `formalizeInfluence` intents with `committeeTileId` + `paymentResourceIds` (+ optional `extraResourceIds`).
- UI base:
  - ActionDock + controller from 0149/0150.

## 3) Context (frozen)

`formalizeInfluence` currently appears as many raw intents in the “More actions” list (because the engine enumerates combinations of payment resources).
That is correct for bots, but poor for human UX.

We will build a **wizard** that progressively filters the same intent set:
1) choose committee tile
2) choose payment resource combo
3) confirm and commit

No rule changes: it’s only a better picker for existing intents.

## 4) Goal (frozen)

- Add a “Formalize Influence” action mode in ActionDock.
- Provide a wizard modal to select one of the legal `formalizeInfluence` intents without dumping all intents as a flat list.
- Keep deterministic ordering of options in the UI (stable across runs).

## 5) Scope (frozen)

### 5.1 In-scope

- ActionDock:
  - Add a “Formalize Influence” mode (active only if there is at least one `formalizeInfluence` intent).
- Board behavior in that mode:
  - Highlight eligible committee tiles (derived from intents’ `payload.committeeTileId`).
  - Clicking a committee opens the wizard.
- Wizard modal:
  - Step A: show selected committee tile id (and basic tile info).
  - Step B: list payment combos:
    - derive from intents filtered by committeeTileId
    - each option corresponds to exactly one `paymentResourceIds` set (and carries the matching intent)
    - show tokens/resort labels for each resource id (presentation-only).
  - Selecting a combo drafts the matching intent and opens the standard confirm modal.
- Deterministic UI ordering:
  - sort combos by `paymentResourceIds.join('|')` lexicographically.
  - if multiple intents share the same payment combo but differ by `extraResourceIds`, show them as sub-options (also sorted).

### 5.2 Out-of-scope

- ConvertResources wizard (next task).
- Any attempt to reduce/alter engine intent enumeration.
- Any “smart” payment recommendation logic beyond sorting.

## 6) Plan (frozen)

1) Add a small UI-only helper: `groupFormalizeIntents(intents)` returning:
   - `byCommitteeTileId: Map<string, Group[]>`
   - `Group = { paymentKey, paymentResourceIds, variants: LegalIntent[] }`

2) Add `FormalizeWizardModal` component:
   - props: `open`, `committeeTileId`, `groups`, `onSelectIntent`, `onClose`
   - renders list of groups and (if needed) sub-variants.

3) Wire into controller:
   - add `wizard` state: `{ kind: 'formalize', committeeTileId } | null`
   - open wizard when committee tile clicked in formalize mode.

4) Tests:
   - add/modify client tests to verify:
     - formalize mode appears only when intents exist
     - clicking committee opens wizard
     - selecting an option does not dispatch until confirm
     - confirm dispatches exactly once

## 7) Acceptance criteria (frozen)

- [ ] FormalizeInfluence no longer requires using the raw “More actions” list for normal play.
- [ ] Wizard options are stable-ordered and derived only from legal intents.
- [ ] No engine changes.
- [ ] Tests green.
