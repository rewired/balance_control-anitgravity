# Codex Task 0027 — Client-Web: Stage UI Registry + Legal Intents Wiring (No Rule Duplication)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Turn structure: CORE-01-04
* Start Committee restrictions: CORE-01-08-04..08-06

---

## Goal

Refactor `packages/client-web` so the UI:

1) uses **only** `@balance-control/game` selectors + `enumerateLegalIntents` for legal targets/actions, and  
2) is **stage-aware** via a small **registry** (no fragile if/else growth), and  
3) does not hardcode illegal targets (e.g. Start Committee) or "probe" moves.

No new rules. No additional game mechanics.

---

## Inputs

* Task 0026 outputs:
  - `@balance-control/game/ui/legality` (`enumerateLegalIntents`, `Intent`)
  - `@balance-control/game/ui/selectors`
* Current client-web structure (as in repo ZIP):
  - `packages/client-web/src/Board.tsx` -> `GameLayout`
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/components/Controls.tsx` (currently hardcoded buttons)
  - `packages/client-web/src/components/Zone.tsx` and `Tile.tsx`

---

## Outputs

### A) Introduce a "UI View-Model" layer (client-side, pure)

Add:

- `packages/client-web/src/ui/useGameViewModel.ts`

It must use `useMemo` and return a single object that components consume:

- `stage` (via `selectStage(ctx, playerID)`)
- `intents` (via `enumerateLegalIntents(G, ctx, playerID)`)
- small helpers derived only via selectors (if needed)

No direct rules logic in client; only mapping/rendering.

### B) Replace stage branching with a registry

Create:

- `packages/client-web/src/ui/stageRegistry.ts`

Pattern:

```ts
type StageRenderer = (vm: GameViewModel) => React.ReactNode;

export const STAGE_UI: Record<string, StageRenderer> = {
  drawAndPlace: renderDrawAndPlace,
  politicalAction: renderPoliticalAction,
};
```

Each renderer must:
- render controls purely based on `vm.intents` (filter by `intent.kind`)
- map `intent -> move call` (via a small dispatcher helper, see Task 0028 or inline minimal mapping)
- avoid reading raw `G` for legality decisions

### C) Controls becomes a thin renderer

Update `packages/client-web/src/components/Controls.tsx`:

- Props must include: `{ G, ctx, moves, events?, playerID, isActive }` (or accept `vm` + `moves`)
- Remove any hardcoded target IDs (especially Start Committee)
- Render buttons / actions solely from `vm.intents`
- If `!isActive`, render nothing (or a disabled panel) as currently

Important: This task does not require a clickable board yet. A "Controls-first" UX is acceptable as long as targets are legal and deterministic.

### D) GameLayout wiring

Update `GameLayout.tsx`:

- Provide required props to `Controls` so it can build/use the view-model (or create vm in layout and pass down)
- No behavioral changes outside wiring

### E) Minimal regression tests (client)

Add React Testing Library checks (or extend existing tests):

- Given a mocked `vm.intents` containing `PlaceInfluence`, UI renders a clickable control and clicking calls `moves.placeInfluence` with the intent payload.
- Given stage `drawAndPlace` intents containing `PlaceTile`, clicking calls `moves.placeTile`.

Tests may mock `enumerateLegalIntents` to focus on UI wiring. The key is: **UI is driven by intents**.

---

## Constraints

* Client must not compute legality (no adjacency/prohibition rules in the UI).
* Client must not import rule docs or encode rule text.
* Local UI state only for selection/hover/panels.
* Do not change engine behavior.

---

## Invariants

* UI enablement and target lists come exclusively from `enumerateLegalIntents`.
* Moves remain the only way to mutate game state.
* Determinism preserved: UI does not rely on timeouts or random UI ordering.

---

## Acceptance Criteria

1. Hotseat (`pnpm -w dev`) works and controls are now intent-driven.
2. No hardcoded illegal targets remain in `Controls.tsx`.
3. Clicking a rendered legal intent triggers exactly the corresponding move call.
4. `pnpm -w test` stays green.

---

## PR Checklist

* [ ] Add `useGameViewModel` hook using selectors + `enumerateLegalIntents`
* [ ] Add stage registry and refactor `Controls` to use it
* [ ] Remove hardcoded/guessed targets from client UI
* [ ] Add minimal client regression tests for move wiring
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0027)
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green
