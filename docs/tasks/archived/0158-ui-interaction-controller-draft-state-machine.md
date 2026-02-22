# Task 0158 — PG-1: Interaction Controller v2 (Draft model + explicit state machine scaffolding)

Status: DONE

## Meta
- Owner: Codex
- Area: UI interaction plumbing (client-web)
- Packages: `packages/client-web`
- Skills: S05 (Boundary Check), S07 (UX Consistency)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Confirm the normative UI contract files exist and are unchanged:
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
3. [x] Baseline scan (no edits yet):
   - `rg -n "confirmProposedIntent|dispatchIntentImmediate|onDispatchIntent|dispatchIntent\(" packages/client-web/src`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Introduce the **data model** needed by ARCH-06 without changing visible behavior yet:
- Add an explicit interaction state machine ID set: `selectingAction / selectingParams / selectingVariant / draftReady / pendingChoiceHardGate`.
- Add a first-class **Draft** representation in the interaction controller (draft intent + derived flags).
- Add controller APIs for the future commit lockdown (`confirmDraft`, `cancelDraft`) while keeping current handlers working.

## 2) Inputs
- Normative UI contract:
  - `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  - `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
- Current interaction layer:
  - `packages/client-web/src/ui/interaction/types.ts`
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/ui/useIntentViewModel.ts`

## 3) Outputs
### 3.1 Code
- Extend `packages/client-web/src/ui/interaction/types.ts` with:
  - `InteractionStateId` (the 5 states above)
  - `DraftIntentState` (at minimum: `intent: LegalIntent | null`, `key: string | null`, `isLegalNow: boolean`)
  - Controller API additions: `confirmDraft()`, `cancelDraft()`, `interactionState: InteractionStateId`, `draft: DraftIntentState`
- Update `packages/client-web/src/ui/interaction/useGameInteractionController.ts` to:
  - compute `interactionState` deterministically from existing controller state + `G.engine.pendingChoice`
  - maintain `draft` state (initially backed by existing `proposedIntent/confirmIntent` fields)
  - expose `confirmDraft/cancelDraft` as wrappers (implementation may delegate to existing confirm/cancel mechanisms in later tasks)

### 3.2 Files touched
- `packages/client-web/src/ui/interaction/types.ts`
- `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

## 4) Constraints
- **No UI behavior change** in this task (scaffolding only).
- **Engine authority (GR-002):** draft legality must be derived from enumerated intents; do not compute new legality.
- **No phantom moves (GR-005):** no new move types.
- **Pending choice gate (GR-006):** `interactionState` must become `pendingChoiceHardGate` whenever `G.engine.pendingChoice` exists.
- Deterministic ordering: any “keying” must be stable (use canonical JSON for payload if needed).

## 5) Acceptance Criteria
- [x] Client-web compiles and tests pass: `pnpm -C packages/client-web test`.
- [x] `useGameInteractionController` returns `interactionState` and `draft` (even if draft is empty).
- [x] When `G.engine.pendingChoice` exists, controller reports `interactionState === 'pendingChoiceHardGate'`.
- [x] No changes to visuals/components required in this task.

## 6) PR Checklist
- [x] Guardrails listed accurately (GR-002/005/006).
- [x] No engine/rule/spec changes.
- [x] No new direct move dispatch paths introduced.
- [x] `pnpm lint` passes.
- [x] `pnpm -C packages/client-web test` passes.
