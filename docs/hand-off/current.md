# Hand-off — Current Snapshot

## Context Capsule (copy/paste)

> **PROJECT:** BALANCE // CONTROL (monorepo, pnpm)
>
> **BASE CONTRACTS:** AGENTS.md + ARCH-01..05
>
> **LAST COMPLETED TASK:** 0138
>
> **CURRENT STATE (facts):**
>
> - `EnginePackRegistry` is the canonical registry in `packages/game` with deterministic ordering + duplicate detection (moves + atoms).
> - `@balance-control/game` does **not** depend on `@balance-control/expansion-*` (decoupled).
> - `@balance-control/packs` is the canonical entrypoint for pack exports and deterministic registration.
> - Pack wrappers (`CorePack`, `Exp01Pack`, `Exp02Pack`, `Exp03Pack`) live in `@balance-control/packs` and reference expansion engine definitions.
> - Measure dispatch is routed via `EnginePackRegistry.getMeasureAtomsForExpansion(...)` and pack-level `getMeasureAtoms` hooks.
> - CORE tile definitions are data-driven (JSON) via `packages/game/src/packs/core/resources/core-tiles.json` and a deterministic generator.
> - Config `packs.enabledPacks` is the canonical enablement surface; legacy `cfg.expansions` is accepted only for compatibility and mismatch-detected.
> - `scripts/verify-packs.mjs` validates pack manifests, canonical order, and public-surface hashing using the public APIs (`@balance-control/game`, `@balance-control/packs`).
>
> **OPEN:**
>
> - (None currently)
>
> **NEXT PACKET GOAL:** Refresh the Task Packet Protocol so the Context Capsule cannot go stale.
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

- **Task:** 0138
- **Date:** 2026-02-19

## Current state (facts)

- `EnginePackRegistry` is the canonical registry in `packages/game` with deterministic ordering + duplicate detection (moves + atoms).
- `@balance-control/game` does **not** depend on `@balance-control/expansion-*` (decoupled).
- `@balance-control/packs` is the canonical entrypoint for pack exports and deterministic registration.
- Pack wrappers (`CorePack`, `Exp01Pack`, `Exp02Pack`, `Exp03Pack`) live in `@balance-control/packs` and reference expansion engine definitions.
- Measure dispatch is routed via `EnginePackRegistry.getMeasureAtomsForExpansion(...)` and pack-level `getMeasureAtoms` hooks.
- CORE tile definitions are data-driven (JSON) via `packages/game/src/packs/core/resources/core-tiles.json` and a deterministic generator.
- Config `packs.enabledPacks` is the canonical enablement surface; legacy `cfg.expansions` is accepted only for compatibility and mismatch-detected.
- `scripts/verify-packs.mjs` validates pack manifests, canonical order, and public-surface hashing using the public APIs (`@balance-control/game`, `@balance-control/packs`).

## Decisions

### Binding

- **Pack split:** Option 2. Rule code may live in pack packages (`packages/expansion-*`), but the engine remains the only executor. (`ARCH-01` already reflects this.)
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

**Refresh Protocol:** Refresh the Task Packet Protocol so the Context Capsule cannot go stale.

## Mini diff map (likely touched)

- `docs/hand-off/task-packet-protocol.md`
- `docs/hand-off/current.md`
- `scripts/verify-handoff.mjs` (if we add a staleness tripwire)
- `package.json` (if we add a `verify:handoff` script)
- `.github/workflows/ci.yml` (if we wire the tripwire into CI)
