# Codex Task 0145 — ENGINE: Make `enumerateLegalIntents` move-valid under costs + usage limits

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0145
- **Owner:** Codex
- **Area:** `packages/game/src/engine/legal-intents.ts`
- **Priority:** P1
- **Risk:** Medium (changes bot/UI-visible intent surface; no rule changes)
- **Branch name:** `task/0145-engine-legal-intents-move-valid-costs-and-usage`
- **Skills:** S03 (Spec Anchor Tracer), S04 (Determinism Guard), S05 (Boundary Check)

## 1) Guardrails (frozen)

- **GR-004 (Single Legal Action Interface):** legality continues to be enumerated only via `enumerateLegalIntents(...)`.
- **GR-003 (Determinism Contract):** intent ordering and any auto-selected payments must be deterministic.
- **GR-013 (Bot Contract):** bot must be able to execute returned intents without hidden “choose resources” side channels.
- **GR-002 (Engine-only Rule Execution):** costs/legality computed in engine; client remains presentation-only.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` — legality enumeration is engine-owned and pure.
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-002, GR-003, GR-004, GR-013.
- `packages/game/src/engine/resolver/costs.ts` — extra cost slot semantics; Ping-Pong penalty slots (`CORE-01-04-12B`).
- `packages/game/src/moves/stages/politicalAction.ts` — move-level cost enforcement + usage enforcement.

## 3) Context (frozen)

Today `enumerateLegalIntents(...)` produces intents that are usually executable, but there are two correctness gaps:

1) **Usage limits are not consistently gated** (e.g. Political Action usage is enforced in moves, but not always filtered in enumeration).
2) **`moveInfluence` can require explicit `extraResourceIds`** (Ping-Pong penalty + extra costs). Enumeration currently checks affordability, but can emit payloads that still fail move validation.

This breaks the “bot selects from intents and executes” contract and can also surface as UI actions that look legal but fail on click.

## 4) Goal (frozen)

- Ensure every intent returned by `enumerateLegalIntents(...)` is **move-valid** under current cost + usage rules.
- Gate Political Action intents on `EffectResolver.checkUsageLimit(..., 'politicalAction', playerId)`.
- When `moveInfluence` requires cost payments, attach a deterministic `extraResourceIds` selection so the intent can execute.
- Preserve deterministic ordering of intents and avoid combinatorial blow-ups.

## 5) Scope (frozen)

### 5.1 In-scope

- Add a small, reusable helper inside `legal-intents.ts` to deterministically pick a **single** payment set for a given list of `CostSlot[]` using `EffectResolver.validateCost(...)`.
- Apply usage gating for **Political Action** intents.
- Update `moveInfluence` enumeration to attach `extraResourceIds` when (and only when) costs are required.

### 5.2 Out-of-scope

- Implementing a player-facing “choose which resources to pay” UI.
- Introducing new move types or new rules.
- Changing cost semantics (what costs exist / when they apply).

## 6) Plan (frozen)

### Entry criteria

- Current snapshot builds and tests are green.

### Steps

1) **Introduce helper: `selectDeterministicExtraResourceIds(...)`**
   - Input: `(G, playerId, costSlots)`.
   - Behavior:
     - If `costSlots.length === 0` → return `[]`.
     - Call `EffectResolver.validateCost(G, null, { playerId, slots: costSlots })`.
     - If ok → return `validation.resourceIds`.
     - If not ok → return `null` (caller skips intent).
   - Determinism note: selection is deterministic given state; relies on supply ordering only.

2) **Gate Political Action intents on usage**
   - At the start of `enumeratePoliticalAction(...)` (or per-action), check:
     - `EffectResolver.checkUsageLimit(G, 'politicalAction', playerID)`
   - If false: enumerate **no** political intents (but still allow `resolveChoice` if pendingChoice is active).

3) **Fix `moveInfluence` payloads under required costs**
   - Keep current legality checks (board tiles, ownership, cap, prohibited).
   - Compute combined `CostSlot[]` that matches move enforcement semantics:
     - Use `EffectResolver.getExtraCostSlots(G, playerID, 'influence.move', targetId, { includePingPongPenalty: true })`.
     - If slots empty → keep payload without `extraResourceIds`.
     - Else → use helper to pick a single `extraResourceIds` list; if `null`, skip intent.
   - Attach `extraResourceIds` to the payload.

4) **Keep intent surface stable**
   - Do not add new fields to `LegalIntent` in this task.
   - Keep `sortIntents(...)` canonical ordering.

5) **Docs (only if needed)**
   - If `@balance-control/game` exports change behavior in a way that affects consumers, add a short entry to `/docs/changelog.md`.

### Exit criteria

- Legal intent enumeration does not emit “clickable but invalid” political intents due to usage/costs.
- `moveInfluence` intents remain bounded (no combinatorial enumeration).

## 7) Acceptance Criteria (frozen)

- `enumerateLegalIntents(...)` returns **no** political intents when `EffectResolver.checkUsageLimit(..., 'politicalAction')` is false.
- When Ping-Pong penalty applies, `enumerateLegalIntents(...)` returns `moveInfluence` intents whose payload includes `extraResourceIds` and the move does not return `INVALID_MOVE`.
- Intent ordering remains deterministic.
- `pnpm -w test` passes.

## 8) Files likely touched (frozen)

- `packages/game/src/engine/legal-intents.ts`
- (optional) `/docs/changelog.md`

## 9) Notes / hazards (frozen)

- Avoid enumerating all possible payment combinations for penalty/cost slots.
- Do not move any rule logic to the client; cost selection remains engine-side.
- If any spec ambiguity is discovered, STOP and create a DD doc (per AGENTS).

## 10) PR Checklist (to be completed before merge)

- [x] Guardrails complied with (GR-002/003/004/013)
- [x] No rules changes; only enumeration correctness
- [x] `pnpm -w test` passes
- [x] Deterministic ordering preserved
- [ ] Updated docs/hand-off/current.md if any snapshot fact changed

## 11) Work Summary (fill after implementation)

- Implemented `selectDeterministicExtraResourceIds` in `legal-intents.ts` to deterministically select resources for cost payments during enumeration.
- Updated `enumerateMoveInfluence` to correct calculate extra costs (specifically Ping-Pong penalty) and attach the required `extraResourceIds` to the intent payload.
- Verified usage gating for political actions via new regression tests.
- Added regression tests in `legal-intents.test.ts` for Ping-Pong penalty execution and usage limit exhaustion.

## 12) Commands Run (fill after implementation)

- `pnpm -C packages/game test -- legal-intents.test.ts`
- `pnpm -w test`

## 13) Postflight (fill after implementation)

- Verified that `moveInfluence` intents are now executable even when penalties apply.

## 14) Patch Notes (fill after implementation)

- Fixed an issue where `moveInfluence` intents could be invalid when Ping-Pong penalty was active.
