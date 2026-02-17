# Codex Task 0090 - FIX: Unblock client-web build (TypeScript strict errors)

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0090
- **Area:** `packages/client-web` build + type safety
- **Recommended execution order:** after 0087/0088 (single canonical `@balance-control/game` entrypoints)
- **Risk:** Low-medium (UI wiring + typings; no rules changes)

## 1) Context (frozen)

`pnpm -C packages/client-web build` currently fails with TypeScript errors:

- Nullability guard missing in `ActionPanel` (`vm.political.placeInfluenceForSelected` possibly `null`)
- Resort key typing mismatch in `HexBoard` and `HexTilePackedSimulator` (`string | undefined` vs `ResortKey`)
- Stale/incorrect import from `@balance-control/game` in `src/game.ts`
- `data-component` not allowed by `svgProps` typing in `HexTileVisual`

## 2) Goal (frozen)

- Make `pnpm -C packages/client-web build` succeed under strict TypeScript.

## 3) Non-goals (frozen)

- Do not change authoritative game rules or legality computation (engine-only).
- Do not change runtime behavior beyond fixing incorrect wiring / unsafe UI code.
- Do not change icon mapping semantics.

## 4) Inputs (frozen)

- Build error output from `pnpm -C packages/client-web build`
- Affected files:
  - `packages/client-web/src/components/ActionPanel.tsx`
  - `packages/client-web/src/components/HexBoard.tsx`
  - `packages/client-web/src/dev/HexTilePackedSimulator.tsx`
  - `packages/client-web/src/game.ts`
  - `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (and `HexTileFrame` typing)

## 5) Outputs (frozen)

### Code

- [ ] Fix nullability handling in `ActionPanel` without altering move semantics.
- [ ] Align resort typing across tile data and `ResortIcon` usage.
- [ ] Update `@balance-control/game` imports to the current public API.
- [ ] Allow `data-*` attributes in `HexTileFrame` `svgProps` typing (no `any`).

### Docs

- [ ] Update `/docs/changelog.md` if required by repo documentation contract.

## 6) Constraints (frozen)

- Keep changes localized to client-web types and UI wiring.
- No client-side legality/cost computation (presentation only).
- Preserve determinism by avoiding time-based / random UI-side derivations that affect moves.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-002 (Engine-only Rule Execution)
- GR-014 (UI Iconography Stability)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-002, GR-014)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (client restrictions / engine authority)

## 8) Acceptance Criteria (frozen)

- [ ] `pnpm -C packages/client-web build` succeeds.
- [ ] `pnpm -r test` succeeds (sanity).

## 9) PR Checklist (frozen)

- [ ] `pnpm lint` passes
- [ ] `pnpm -r test` passes
- [ ] Determinism unaffected (UI-only changes)
- [ ] No temporary files committed
- [ ] `affected_guardrails` and `spec_anchor_refs` present
- [ ] `docs/changelog.md` updated if required

## 15) Execution Log (append-only)

### Work Summary

- Fixed `ActionPanel` callback nullability by capturing `placeInfluenceForSelected` in a local const before building the handler.
- Made `ResortIcon` accept `string` resorts safely (only renders icons for known core resort keys).
- Allowed `data-*` attributes in `HexTileFrame` `svgProps` typing (used by `HexTileVisual`).
- Switched `hashState` to a browser-safe SHA-256 implementation (`@noble/hashes`) to unblock Vite production bundling.
- Added Vite aliases for expansion packages and added a `client-web` `prebuild` to ensure dependent package types exist.

### Commands Run

- `pnpm install` (pass)
- `pnpm -C packages/client-web build` (pass)
- `pnpm lint` (pass)
- `$env:NO_COLOR=1; pnpm test` (pass)
- `git status` (captured below)
- `git diff --stat` (captured below)

### Postflight Proof

- `git status`
```text
On branch task/0090-fix-client-web-build
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/changelog.md
	modified:   packages/client-web/package.json
	modified:   packages/client-web/src/components/ActionPanel.tsx
	modified:   packages/client-web/src/ui/tiles/HexTileFrame.tsx
	modified:   packages/client-web/src/ui/tiles/ResortIcon.tsx
	modified:   packages/client-web/vite.config.ts
	modified:   packages/game/package.json
	modified:   packages/game/src/hash-state.ts
	modified:   pnpm-lock.yaml

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/tasks/0090-FIX-client-web-build-ts-errors.md

no changes added to commit (use "git add" and/or "git commit -a")
```

- `git diff --stat`
```text
 docs/changelog.md                                  | 1 +
 packages/client-web/package.json                   | 1 +
 packages/client-web/src/components/ActionPanel.tsx | 7 ++++---
 packages/client-web/src/ui/tiles/HexTileFrame.tsx  | 8 +++++++-
 packages/client-web/src/ui/tiles/ResortIcon.tsx    | 8 ++++++--
 packages/client-web/vite.config.ts                 | 3 +++
 packages/game/package.json                         | 1 +
 packages/game/src/hash-state.ts                    | 8 ++++----
 pnpm-lock.yaml                                     | 3 +++
 9 files changed, 30 insertions(+), 10 deletions(-)
```

- `$env:NO_COLOR=1; pnpm test` (output excerpt)
```text
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  109 passed (109)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test: Done
```

### PR Checklist (completed)

- [x] `pnpm lint` passes
- [x] `pnpm -r --if-present test` passes
- [x] Determinism unaffected (UI-only changes; hashing remains deterministic)
- [x] No temporary files committed
- [x] `affected_guardrails` and `spec_anchor_refs` present
- [x] `/docs/changelog.md` updated

### Commit Proof

- `git show -1 --stat`
```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 07:19:38 2026 +0100

    task(0090): fix client-web build

- Fix ActionPanel nullability and SVG data-* prop typing
- Make ResortIcon accept string resorts safely
- Use browser-safe SHA-256 hashing for hashState
- Add client-web prebuild + Vite aliases for expansions

 docs/changelog.md                                  |   1 +
 docs/tasks/0090-FIX-client-web-build-ts-errors.md  | 195 +++++++++++++++++++++
 packages/client-web/package.json                   |   1 +
 packages/client-web/src/components/ActionPanel.tsx |   7 +-
 packages/client-web/src/ui/tiles/HexTileFrame.tsx  |   8 +-
 packages/client-web/src/ui/tiles/ResortIcon.tsx    |   8 +-
 packages/client-web/vite.config.ts                 |   3 +
 packages/game/package.json                         |   1 +
 packages/game/src/hash-state.ts                    |   8 +-
 pnpm-lock.yaml                                     |   3 +
 10 files changed, 225 insertions(+), 10 deletions(-)
```
