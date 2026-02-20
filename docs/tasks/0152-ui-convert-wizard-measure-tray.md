# Codex Task 0152 — UI: ConvertResources wizard + TakeMeasure tray + unknown-intent fallback

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0152
- **Owner:** Codex
- **Area:** `packages/client-web/src/**`
- **Priority:** P2
- **Risk:** Medium (multi-step picker + measure rendering)
- **Branch name:** `task/0152-ui-convert-wizard-measure-tray`
- **Skills:** S07 (UX Consistency), S05 (Boundary Check)

## 1) Guardrails (frozen)

- **GR-002 (Engine-only Rule Execution):** UI filters/chooses only from enumerated intents.
- **GR-006 (Pending Choice Gate):** pendingChoice blocks all other UI.
- **GR-005 (No Phantom Moves):** no new moves.

## 2) Spec anchors (frozen)

- `docs/rules/000-core.md`
  - `CORE-01-04-09` (ExactlyOnePoliticalAction)
  - `CORE-01-04-09` (ConvertResources is part of the allowed action set)
- `packages/game/src/engine/legal-intents.ts`
  - `enumerateConvertResources(...)` emits intents with payload fields: `grassrootsTileId`, `inputResourceIds`, `outputResort`, `extraResourceIds?`
  - `enumerateTakeMeasure(...)` emits intents with `moveType = "<expansionId>.takeMeasure"` and payload = measure object id.
- `docs/architecture/TECH-01-BIG-PICTURE.md` — intent-only API.

## 3) Context (frozen)

ConvertResources and TakeMeasure can generate many intents. Dumping them as a flat “More actions” list becomes unplayable.

We introduce:
- a ConvertResources wizard (tile → output resort → input resources → confirm)
- a Measure tray (group and render open measures with one-click draft → confirm)

Additionally, expansions can introduce new move types, so we keep a safe fallback:
- a compact “Other actions” list for moveTypes not covered by specialized surfaces.

## 4) Goal (frozen)

- Make ConvertResources usable without scrolling through hundreds of raw intents.
- Surface TakeMeasure actions in a dedicated tray grouped by expansion/deck.
- Preserve a safe fallback list for unknown intents.

## 5) Scope (frozen)

### 5.1 In-scope

**ConvertResources mode**
- ActionDock: add “Convert Resources” mode (visible when any convert intents exist).
- Board highlight: eligible Grassroots tiles derived from intents’ `payload.grassrootsTileId`.
- Wizard steps:
  1) choose Grassroots tile (board click)
  2) choose output resort (DOM/FOR/INF) (small button row)
  3) choose input resource combo (list derived from intents filtered by tile+output)
  4) draft intent → confirm modal → commit

**TakeMeasure tray**
- In ActionDock (or right sidebar), show “Measures” section when any `*.takeMeasure` intents exist.
- Group by moveType prefix (`EXP-01`, `EXP-02`, `EXP-03`, …).
- Label each measure using `G.objects[objectId].measureId ?? objectId`.

**Unknown-intent fallback**
- Keep a small “Other actions” list:
  - show one line per intent with `moveType` + a short label (best-effort)
  - selection drafts and confirm-gates (do not instant-commit)

### 5.2 Out-of-scope

- Any improvements to engine enumeration budgets.
- Any new pack-provided UI extensions; only core UI handles generic unknown intents.

## 6) Plan (frozen)

1) Convert grouping helpers:
   - `groupConvertIntents(intents)`:
     - by `grassrootsTileId`
     - within that by `outputResort`
     - within that list distinct `inputResourceIds` combos (+ variants by `extraResourceIds`)

2) Add `ConvertWizardModal`:
   - similar pattern to Formalize wizard
   - stable ordering (lexicographic by joined ids)

3) Add `MeasureTray` component:
   - render grouped measures and draft on click

4) Ensure fallback list still exists and is confirm-gated.

5) Tests:
   - verify convert mode appears when intents exist
   - verify wizard filters intents correctly and dispatches only after confirm
   - verify takeMeasure tray renders and drafts on click

## 7) Acceptance criteria (frozen)

- [ ] ConvertResources playable via wizard; no flat explosion list required.
- [ ] Measures are visible and selectable via tray when present.
- [ ] Unknown intents remain accessible via fallback list.
- [ ] PendingChoice still blocks everything else.
- [ ] Tests green.
