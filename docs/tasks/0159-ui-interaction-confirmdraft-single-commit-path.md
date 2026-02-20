# Task 0159 — PG-1: Single normal commit path (confirmDraft → dispatchIntent) + remove UI-side direct dispatch access

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI interaction plumbing (client-web)
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S07 (UX Consistency)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-read ARCH-06 contract + checklist:
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
3. [ ] Baseline scan (no edits yet):
   - `rg -n "\bdispatchIntent\b|dispatchIntentImmediate|confirmProposedIntent|onDispatchIntent" packages/client-web/src`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Make it impossible for UI components to “commit a normal move” directly.

After this task:
- The only normal move commit flow is:
  `useGameInteractionController.confirmDraft()` → `dispatchIntent(moves, draftIntent)`.
- UI components (ActionDock / BoardSurface / modals) **must not receive** a generic `dispatchIntent(intent)` callback.
- Pending choice resolution remains allowed as a special path (`resolveChoice`) and is still gated by GR-006.

## 2) Inputs
- Interaction layer:
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/ui/interaction/dispatchIntent.ts`
  - `packages/client-web/src/ui/interaction/types.ts`
- Current commit shortcuts (to be removed from component surfaces):
  - `packages/client-web/src/components/ActionDock.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/components/BoardViewport.tsx`
  - `packages/client-web/src/components/GameLayout.tsx`
  - `packages/client-web/src/components/MoveConfirmationModal.tsx`
  - `packages/client-web/src/components/ModalHost.tsx`

## 3) Outputs
### 3.1 Code
- Controller API changes:
  - Remove/stop exporting `dispatchIntent(intent)` from the controller surface.
  - Remove `dispatchIntentImmediate(...)` from controller (or make it private/internal).
  - `confirmDraft()` must be the only “normal commit” entrypoint.
  - `resolveChoice(selectionOrIntent)` remains, but must only dispatch `resolveChoice` intents.
- Dispatch helper changes:
  - Keep `dispatchIntent(moves, intent)` as the single low-level executor.
  - Update controller to call `dispatchIntent` only from:
    - `confirmDraft()` (normal)
    - `resolveChoice()` (pending choice)
- Component wiring (minimal, compile-focused):
  - Replace any direct dispatch calls with **drafting** + confirmation:
    - `ActionDock` must draft intents via controller (no direct commit).
    - `HexBoard` must draft intents via controller (no direct commit).
  - Existing confirmation UI may still be modal-based in this task (MoveConfirmationModal), but the modal must call `controller.confirmDraft()`.

### 3.2 Tests
- Update client-web tests that currently assume direct dispatch on click:
  - `packages/client-web/test/action-dock.test.tsx`
  - `packages/client-web/test/tile-placement-ux.test.tsx`
  - any other failing tests caused by the removal of `onDispatchIntent`

### 3.3 Files touched
- `packages/client-web/src/ui/interaction/types.ts`
- `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
- `packages/client-web/src/ui/interaction/dispatchIntent.ts` (only if required)
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/components/HexBoard.tsx`
- `packages/client-web/src/components/BoardViewport.tsx`
- `packages/client-web/src/components/GameLayout.tsx`
- `packages/client-web/src/components/MoveConfirmationModal.tsx`
- `packages/client-web/src/components/ModalHost.tsx`
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- **No ad-hoc move payloads (GR-002):** drafting must pick an already-enumerated `LegalIntent` instance (or match by stable key), never construct payloads manually.
- **No phantom moves (GR-005):** only enumerate and draft what the engine provides.
- **Pending choice gate (GR-006):** when pendingChoice exists, the controller must not allow drafting/confirming normal intents.
- Determinism: all derived sorting (e.g., intent keying) must be stable.

## 5) Acceptance Criteria
- [ ] No component in `packages/client-web/src/components/**` calls `moves[moveType](...)` or `dispatchIntent(...)` directly.
- [ ] `MoveConfirmationModal` (if still used) calls `controller.confirmDraft()` and `controller.cancelDraft()`.
- [ ] In normal play (no pendingChoice), there is no path to commit a move other than `confirmDraft()`.
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] No new commit shortcut functions exported from UI.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
