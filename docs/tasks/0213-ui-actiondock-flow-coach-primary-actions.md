# Task 0213 — PG-7: Simplify ActionDock for flow (coach header + 3 primary actions + “More…”)

Status: DRAFT

## Meta
- Owner: Codex
- Area: ActionDock information architecture (flow-first)
- Packages: `packages/client-web`
- Skills: S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Re-check the UI interaction contract + checklist:
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
   - `/docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
3. [ ] Baseline scan (no edits yet):
   - `rg -n "ActionGroupList|action-group|action-panel-header" packages/client-web/src/components/ActionDock.tsx`
   - `pnpm -C packages/client-web test` (record outcome for Postflight)

## 1) Goal
Reduce cognitive load and improve “what do I do now?” clarity without changing any rules:
- Replace the generic “Actions + Stage” header with a **coach header** describing the current next step.
- In political action, replace multi-group lists with:
  - **Up to 3 primary action cards/buttons** (largest, most common)
  - Everything else behind **“More…”** (still deterministic ordering, still draft→confirm)

## 2) Inputs
- Dock:
  - `packages/client-web/src/components/ActionDock.tsx`
- I18N:
  - `packages/client-web/src/ui/i18n/en.json`
  - `packages/client-web/src/ui/i18n/de.json`
- Interaction controller state (read-only usage):
  - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
  - `packages/client-web/src/ui/interaction/types.ts`

## 3) Outputs
### 3.1 Code
#### 3.1.1 Coach header
- Add a single “Next step” line (short imperative) derived from existing state:
  - Stage: `vm.stage` (drawAndPlace / politicalAction)
  - Controller: `interactionState`, `actionMode`, pinned params (e.g., moveInfluenceSourceId)
- Suggested mapping (best-effort, do not invent rules):
  - drawAndPlace: “Place your tile.”
  - politicalAction + selectingAction: “Choose an action.”
  - selectingParams: “Select source / destination / tile” depending on mode + pinned state.
  - selectingVariant: “Select variant.”
  - draftReady: “Review & confirm.”
- Add i18n keys under `core.coach.*` (EN + DE). Keep short.

#### 3.1.2 3 primary actions (politicalAction)
- Replace the current per-group UI with a simpler surface:
  - Primary actions are the most common:
    1) Place influence (if legal)
    2) Move influence (if legal)
    3) Formalize OR Convert OR Take measure (choose in deterministic priority order)
- For each primary action button/card:
  - show label + optional small count derived from enumerated intents (e.g., “(5 targets)”)
  - never compute legality (only count/filter from `vm.intents` and `vm.political.*`)
- Everything not shown as primary goes into:
  - a single `details/summary` section “More actions (N)”
  - list entries remain deterministically sorted (use existing `intentSortKey`).

#### 3.1.3 Keep contract semantics
- Do not change:
  - draft->confirm model
  - dock-only confirm/cancel
  - hard-gate behavior while pendingChoice exists

### 3.2 Tests
- Update or add tests to confirm:
  - Coach header text changes as `interactionState` changes.
  - Political action shows up to 3 primary actions + “More…” when extras exist.
  - No regression: selecting an action still only drafts (no commit).

### 3.3 Files touched
- `packages/client-web/src/components/ActionDock.tsx`
- `packages/client-web/src/ui/i18n/en.json`
- `packages/client-web/src/ui/i18n/de.json`
- `packages/client-web/test/*` (as needed)

## 4) Constraints
- Engine authority (GR-002): coach header and counts must be derived from already-enumerated intents only.
- No phantom moves (GR-005): do not add new actions (pass/end turn).
- Pending choice gate (GR-006): no coach/primary actions should appear when pendingChoice exists (unless already required by contract).

## 5) Acceptance Criteria
- [ ] The dock has a clear coach header describing the next step (EN + DE).
- [ ] Political action phase shows up to 3 primary actions and a single “More…” section.
- [ ] The UI remains deterministic (ordering does not change across runs with identical state).
- [ ] `pnpm -C packages/client-web test` passes.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] No new commit shortcuts / auto-commit.
- [ ] `pnpm -C packages/client-web test` passes.

## 7) Work Summary
- TBD (append-only)

## 8) Commands Run
- TBD (append-only)
