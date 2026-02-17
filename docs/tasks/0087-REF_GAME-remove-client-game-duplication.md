# Codex Task 0087 - REF_GAME: Remove client/server game-definition divergence

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0087
- **Area:** `packages/game` exports + `packages/client-web` module wiring
- **Recommended execution order:** do before any larger engine refactors that assume one canonical Game definition
- **Risk:** Medium (wiring change can surface hidden reliance on stale client-game behavior)

## 1) Context (frozen)

Right now the web client does **not** use the same `BalanceControl` Game definition as the rest of the repo.

- Server + tests import `packages/game/src/index.ts` (`export const BalanceControl ...`)
- Client (`packages/client-web`) aliases `@balance-control/game` to `packages/game/src/client-game.ts` via Vite.
- `client-game.ts` contains a *second* `BalanceControl` implementation that has drifted from `index.ts` (missing/older round-start and production ordering logic, different onEnd behavior, etc.).

This is dangerous:
- Hotseat / local-client execution can diverge from server-authoritative behavior.
- Golden replays and determinism are harder to trust because there are effectively two rules engines.

## 2) Goal (frozen)

- Ensure **exactly one** canonical `BalanceControl` Game definition is used across:
  - `packages/server`
  - `packages/client-web` (including hotseat)
  - `packages/bot-llm`
  - `packages/game` tests
- Eliminate the duplicated/stale Game definition in `client-game.ts`.

## 3) Non-goals (frozen)

- Do not redesign turn structure, rules, or resolver logic.
- Do not change gameplay behavior intentionally.
- Do not rework bundling beyond what is required to point the client at the canonical file.

## 4) Inputs (frozen)

- `packages/game/src/index.ts` (canonical Game definition)
- `packages/game/src/client-game.ts` (duplicated/stale Game definition)
- `packages/client-web/vite.config.ts` (aliases `@balance-control/game` → `client-game.ts`)
- Client entry points importing `BalanceControl`:
  - `packages/client-web/src/App.tsx`
  - `packages/client-web/src/hotseat/HotseatShell.tsx`
  - `packages/client-web/src/components/LobbyScreen.tsx`

## 5) Outputs (frozen)

### Code

- [ ] Update `packages/client-web/vite.config.ts` alias so `@balance-control/game` resolves to **the canonical** source (`../game/src/index.ts`) for dev builds.
- [ ] Remove duplication:
  - either delete `packages/game/src/client-game.ts`, **or**
  - replace it with a thin re-export barrel that forwards everything from `./index` (no duplicated logic).

### Tests

- [ ] `pnpm -r test` passes (at least `packages/game` and `packages/client-web`).
- [ ] If any client-only tests exist, ensure they still pass under the updated alias.

## 6) Constraints (frozen)

- Engine authority remains in `packages/game` (client stays presentation-only).
- Determinism must not regress (golden replays remain valid).
- No silent logic changes: any behavior change must be treated as a bugfix and justified by existing spec text.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-002 (Engine-only Rule Execution)
- GR-003 (Determinism Contract)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-002, GR-003)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (client is presentation-only; engine authority)

## 8) Acceptance Criteria (frozen)

- [ ] Client builds and runs using the same `BalanceControl` definition as server/tests.
- [ ] There is no second/stale copy of the Game object logic in the repo.
- [ ] Golden replay tests remain unchanged (unless a prior client-only divergence is now fixed; then document why).

## 9) PR Checklist (frozen)

- [ ] Client alias points at canonical game source
- [ ] Duplicated game-definition code removed or converted to pure re-export
- [ ] No intentional behavior changes
- [ ] Tests pass (`pnpm -r test`)
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- 

### Commands Run

- 

### Postflight Proof

- 
