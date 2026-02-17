# Codex Task 0098 - Convert EXP-01/02/03 to First-Class Engine Packs

**Date:** 2026-02-17  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Normative specs to treat as anchors:
- `/docs/rules/001-expansion01.md` (EXP-01 v1.3)
- `/docs/rules/002-expansion02.md` (EXP-02 v1.0)
- `/docs/rules/003-expansion03.md` (EXP-03 v1.0)

---

## Goal

Make all expansions fully comply with the same **Pack Contract** as Core.

**Target outcome:** EXP-01, EXP-02, EXP-03 are implemented as:
- `Exp01Pack`, `Exp02Pack`, `Exp03Pack`
- registered via `EnginePackRegistry.registerPack(pack)`
- providing their setup hooks, moves, and atoms/resolvers through the *same* mechanism as Core
- with **zero** legacy special-casing or alternate “old” attachment paths

---

## Inputs

- Pack registry exists and is now the only assembly path (Task 0097).
- CorePack exists and can be used as the reference implementation of the contract.

---

## Outputs

### A) Pack modules for each expansion

Create (or refactor into) one module per expansion pack, example layout (adapt to repo conventions):
- `packages/game/src/packs/exp01/Exp01Pack.ts`
- `packages/game/src/packs/exp02/Exp02Pack.ts`
- `packages/game/src/packs/exp03/Exp03Pack.ts`

Each pack must export:
- `manifest` (id + version + ruleset anchor; details in Task 0099)
- `register(registry)` (or whatever the contract is) that registers:
  - expansion zones (if explicit zone registration exists)
  - setup modifications (adding tiles/measures/regulations/countdowns to initial state)
  - moves (e.g., TakeMeasure/PlayMeasure if expansion enables them)
  - atoms/resolvers/effect modifiers (e.g., regulations / climate stacking hooks)

### B) Expansion isolation invariants

Ensure that expansion-specific objects/zones remain isolated per state-shape contract:
- expansion measure decks must not mix with other expansions’ measure decks
- regulations/countdowns must exist only when their expansion is enabled
- cross-expansion interactions must be explicit and deterministic

### C) One enablement mechanism

There must be one enablement switch:
- Match config (or game setup) specifies enabled expansion pack IDs.
- Engine assembly decides which packs are active.
- Client does not assume expansions; it reads enabled packs from state (to be added in Task 0100).

---

## Constraints

- Do not change the normative rules; implement/encode only what is in the specs.
- Deterministic state only (JSON serializable).
- No object mixing across expansions unless explicitly defined.
- Avoid touching unrelated UI except where required to keep build green.

---

## Invariants

- If an expansion pack is disabled, its zones/resources/components do not exist in state and its moves are not legal.
- If enabled, all its zones exist and are wired into effect resolution deterministically.

---

## Acceptance Criteria

- A core-only match starts and runs without expansion state artifacts.
- Enabling exactly one expansion adds only that expansion’s zones and legal moves.
- At least one minimal integration test per expansion exists (can be tiny):
  - enable pack -> ensure expected zones exist and at least one expansion move is enumerated/legal where applicable.

---

## PR Checklist

- [ ] Exp01Pack/Exp02Pack/Exp03Pack created and registered via pack registry
- [ ] No legacy expansion attachment paths remain
- [ ] Expansion zones are isolated and only exist when enabled
- [ ] Tests added (smoke/integration) for core-only and each single-expansion enablement
- [ ] Meaningful commit message, e.g. `engine: implement EXP packs via pack registry`
