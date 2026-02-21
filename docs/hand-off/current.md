# Hand-off — Current Snapshot

## Context Capsule (copy/paste)

> **PROJECT:** BALANCE // CONTROL (monorepo, pnpm)
>
> **BASE CONTRACTS:** AGENTS.md + ARCH-01..05
>
> **LAST COMPLETED TASK:** 0185
>
> **CURRENT STATE (facts):**
>
> - `EnginePackRegistry` is the canonical registry in `packages/game` with deterministic ordering + duplicate detection (moves + atoms).
> - `@balance-control/game` does **not** depend on `@balance-control/expansion-*` (decoupled).
> - `@balance-control/packs` is the canonical entrypoint for pack exports and deterministic registration.
> - `InteractionController` manages multi-step draft state; actions are committed only via explicit confirm; direct interaction via `ClickGate` (ARCH-06).
> - `verify:ui-interaction` script enforces no-direct-commit tripwire on UI components.
> - i18n scaffolded for `en` and `de`; initial keys mapped for ActionDock and Inspector.
> - `scripts/verify-packs.mjs` validates pack manifests, canonical order, and public-surface hashing.
>
> **OPEN:**
>
> - (None currently)
>
> **NEXT PACKET GOAL:** CORE rules conformance patchset (0187–0192): DrawPile top semantics, starting player RNG, atomic costs, influence supply legality, hotspot resolved-mark, convert intent parity.
>
> **CONSTRAINTS:**
>
> - No rule changes without Spec Anchor
> - Build + Tests green
> - Maintain deterministic sorting / canonical order
>
> **DELIVERABLE:** ZIP with 2–4 Codex Tasks in repo-standard Contract Format + Update for docs/hand-off/current.md

---

## Last done

- **Task:** 0185
- **Date:** 2026-02-21

## Current state (facts)

- `EnginePackRegistry` is the canonical registry in `packages/game` with deterministic ordering + duplicate detection (moves + atoms).
- `@balance-control/game` does **not** depend on `@balance-control/expansion-*` (decoupled).
- `@balance-control/packs` is the canonical entrypoint for pack exports and deterministic registration.
- `InteractionController` manages multi-step draft state; actions are committed only via explicit confirm (ARCH-06).
- `verify:ui-interaction` script enforces no-direct-commit tripwire on UI components.
- i18n scaffolded for `en` and `de`; initial keys mapped for ActionDock and Inspector.
- Pack wrappers (`CorePack`, `Exp01Pack`, `Exp02Pack`, `Exp03Pack`) live in `@balance-control/packs` and reference expansion engine definitions.
- Measure dispatch is routed via `EnginePackRegistry.getMeasureAtomsForExpansion(...)`.
- CORE tile definitions are data-driven (JSON) via `packages/game/src/packs/core/resources/core-tiles.json`.
- `scripts/verify-packs.mjs` validates pack manifests, canonical order, and public-surface hashing using the public APIs.

## Decisions

### Binding

- **Pack split:** Option 2. Rule code may live in pack packages (`packages/expansion-*`), but the engine remains the only executor. (`ARCH-01` reflects this.)
- **Canonical Pack Entrypoint:** `@balance-control/packs` is the single source of truth for app wiring.
- **EnginePackRegistry Location:** Stays in `packages/game` as the kernel registry mechanism.

### Open

- (None currently)

## Invariants (must not break)

- Build + tests stay green.
- No rules changes without SPEC anchor.
- Deterministic ordering and hashing stay stable (canonical pack order, deterministic shuffles, sorted lists).
- No client-side rule execution; engine stays authoritative (ARCH-01).

## Next packet goal

**CORE rules conformance patchset (0187–0192):**

- **0187:** DrawPile top = first element (shift() instead of pop()).
- **0188:** Starting player RNG (canonical seed-based selection).
- **0189:** PlaceTile atomic costs (pay before placement).
- **0190:** PlaceInfluence requires personal supply check.
- **0191:** Hotspot resolved-mark persists correctly.
- **0192:** ConvertResources enumeration matches variant spec.

## Mini diff map (likely touched)

- `packages/game/src/mechanics-draw.ts` (0187)
- `packages/game/src/logic/GameLogic.ts` (0188)
- `packages/game/src/moves/PlaceTile.ts` (0189)
- `packages/game/src/moves/PlaceInfluence.ts` (0190)
- `packages/game/src/state/Board.ts` (0191)
- `packages/game/src/mechanics/conversion.ts` (0192)
- `packages/game/src/engine/legal-intents.ts` (0192)
- `docs/hand-off/current.md`

