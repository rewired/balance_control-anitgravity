# Codex Task 0131 — CONFIG: Make `packs.enabledPacks` canonical at runtime

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0131
- **Owner:** Codex
- **Area:** `packages/game` config + setup; `scripts/verify-packs`
- **Priority:** P1
- **Risk:** Medium (touches setup/config wiring, but should be rules-neutral)
- **Branch name:** `task/0131-config-packs-enabledpacks-canonical`

## 1) Guardrails (frozen)

- **GR-012 (Single Config Authority):** `packs.enabledPacks` must be the canonical enablement surface.
- **GR-003 (Determinism):** no nondeterministic ordering; stable hashing must remain stable.
- **ARCH-01 (Engine authority):** client does not execute rules; setup stays deterministic.

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-012, GR-003
- `ARCH-01-ENGINE-CONTRACT.md` — DETERMINISM, BOOT CONTRACT

## 3) Context (frozen)

We have both legacy expansion flags (`cfg.expansions.ex01..ex03`) and the new packs surface (`cfg.packs.enabledPacks`). Normalization already derives one from the other, but runtime paths still directly read `cfg.expansions` (e.g. setup ruleset manifest selection). This keeps legacy flags “alive” and makes it too easy for config drift.

We want to treat `packs.enabledPacks` as the single canonical enablement input. The legacy flags remain supported as an *input* to normalization, and as a *derived* compatibility view, but runtime logic must not branch on it.

## 4) Goal (frozen)

Make runtime and tooling use `packs.enabledPacks` as the only enablement signal, while keeping backwards-compatible normalization for callers that still pass `expansions` flags.

## 5) Scope (frozen)

### 5.1 In-scope

- Update runtime paths that currently read `cfg.expansions` to derive from `cfg.packs.enabledPacks` instead.
- Add **mismatch detection**: if both `expansions` and `packs.enabledPacks` are provided and conflict, throw an explicit error during normalization.
- Update `scripts/verify-packs.mjs` to pass `packs.enabledPacks` configs (stop using legacy flags there).
- Update/adjust tests to reflect the new contract.

### 5.2 Out-of-scope

- Removing the legacy `expansions` field from the `GameConfig` type.
- Pack split / removing `@balance-control/game` hard dependencies on `@balance-control/expansion-*`.
- Any rules behavior changes.

## 6) Plan (frozen)

### Entry criteria

- Repo builds/tests pass at HEAD.

### Steps

1) **Normalization mismatch guard**
   - In `packages/game/src/config.ts` `normalizeGameConfig(...)`, when both inputs are present:
     - Derive `enabledPacks` from `packs.enabledPacks`.
     - Derive `enabledPacks` from `expansions` flags.
     - If they differ (after canonicalization + dedupe + implied `core`), throw a clear error (include both views in message).

2) **Runtime reads: stop using `cfg.expansions`**
   - In `packages/game/src/setup.ts`:
     - Build `rulesetManifest.expansions` based on `gameConfig.packs.enabledPacks` (presence of `exp01/exp02/exp03`).
     - Keep `engine.attributes.enabledExpansions` for compatibility, but *derive it from* `packs.enabledPacks`.

3) **Tooling: verify-packs uses packs config**
   - In `scripts/verify-packs.mjs`, replace `getFlagConfig(...)` with a helper that returns `{ packs: { enabledPacks: [...] } }`.

4) **Update tests**
   - Update `packages/game/test/config-normalization.test.ts`:
     - The “both provided” test must now **expect a throw** on mismatch.
     - Add a positive case: both provided and consistent should not throw.
   - Update any tests that pass `setupData` with legacy flags to prefer packs.

### Exit criteria

- No runtime code paths in `packages/game/src` read `cfg.expansions` except inside config normalization.
- `scripts/verify-packs.mjs` uses only `packs.enabledPacks` configs.
- Build + tests are green.

## 7) Acceptance Criteria (frozen)

- `pnpm -r build` passes.
- `pnpm -r test` passes.
- `grep -R "meta\.cfg\.expansions\|cfg\.expansions" packages/game/src` returns matches only in `packages/game/src/config.ts` (normalization/defaults).
- Passing conflicting `setupData` containing both surfaces fails fast with a clear error message.

## 8) Files likely touched (frozen)

- `packages/game/src/config.ts`
- `packages/game/src/setup.ts`
- `packages/game/test/config-normalization.test.ts`
- `scripts/verify-packs.mjs`

## 9) Notes / hazards (frozen)

- Do **not** change pack enablement semantics (canonical ordering, implied `core`, pinned version validations).
- This task is allowed to change error behavior for “conflicting config”, but must not change rules execution.

## 10) PR Checklist (to be completed before merge)

- [ ] Build passes (`pnpm -r build`)
- [ ] Tests pass (`pnpm -r test`)
- [ ] No rules changes (SPEC-anchored)
- [ ] Deterministic ordering preserved (no new nondeterminism)
- [ ] Updated docs/hand-off/current.md if any decision/fact changed

## 11) Work Summary (fill after implementation)

- 

## 12) Commands Run (fill after implementation)

- 

## 13) Postflight (fill after implementation)

- 

## 14) Patch Notes (fill after implementation)

- 

## 15) Downstream follow-ups

- After Wave 1 is complete, schedule Wave 2 to delete legacy expansion flags from runtime surfaces (and eventually type), gated by a compatibility decision.
