# Changelog — BALANCE // CONTROL

## Unreleased

- 2026-02-24: task(0252) Tooling/CI: Add dedicated root UI QA scripts (`test:ui:unit`, `test:ui:e2e`, `test:ui:all`) and split frontend CI gates into explicit UI-unit and UI-E2E jobs for faster failure attribution.
- 2026-02-24: task(0251) Engine/Tests: Add shared cost-bucket helpers (duplicate/overlap validation, semantic list partitioning, deterministic fallback selection) and refactor `moveInfluence` + `convertResources` to use them.
- 2026-02-24: task(0250) Engine/Tests: Add shared political-action stage+usage guard and canonical finalize helper, wire all four political-action moves through it (with Start Committee usage hook support), and add regression tests for stage/usage/finalization invariants.
- 2026-02-24: task(0250) Engine: Split political-action moves into per-move modules under `packages/game/src/moves/stages/politicalAction/` with a compatibility `index.ts` export (mechanical refactor; no semantic changes).
- 2026-02-24: task(0249) Tests/Docs: Close settlement/endgame evidence with explicit immediate-end assertions after final settlement trigger, illegal post-end political-action no-op proof, and deterministic replay revalidation (no runtime logic changes).
- 2026-02-24: task(0248) Tests/Docs: Close resolver + production evidence loop via obligation-audit confirmation, deterministic focused suite reruns, and task artifact completion (no runtime logic changes).
- 2026-02-24: task(0247) Tests/Docs: Close turn-gating and legal-intent evidence loop via audit/test revalidation and task artifact completion (no runtime logic changes).
- 2026-02-24: task(0245) Tests/Docs: Close topology evidence gaps with direct Board position-binding and placeTile adjacency assertions; align obligation registry links and add DD trace (no runtime logic changes).
- 2026-02-24: task(0244) Tests/Docs: Harden CORE endgame legality evidence with assertion-level winner/tie checks and deterministic immediate-settlement replay coverage (no runtime logic changes).
- 2026-02-24: task(0243) Tests/Docs: Harden resolver + production evidence with explicit CORE production tie/noise assertions, Start Committee immunity proof, and deterministic golden replay rerun coverage (no runtime logic changes).
- 2026-02-24: task(0242) Tests: Harden turn-stage gating and legal-intent evidence (pendingChoice ownership gate + draw/political stage legality assertions; no runtime logic changes).
- 2026-02-24: task(0241) Tests/Docs: Harden setup + draw-flow obligation evidence with explicit assertion bindings for setup order, canonical shuffle/RNG sequencing, and 2-player starting Influence allocation (no runtime logic changes).
- 2026-02-24: task(0240) Tests/Docs: Harden topology obligation evidence with explicit CORE-01-00-11 and CORE-01-00-12 assertion bindings (no runtime logic changes).
- 2026-02-23: task(0227) Engine: Deduplicate ConvertResources legal intents by collapsing fungible payment token-ID combinations; deterministic auto-payment when IDs are omitted.
- 2026-02-23: task(0226) Engine: Prevent legal-intent enumeration stack overflow when intent sets are very large (e.g., ConvertResources).
- 2026-02-22: task(0222) Engine/UI: Remove passTilePlacement and auto-run final settlement at end-of-game (CORE-01-09-01A, VAR-01-01-08).
- 2026-02-22: task(0219) UI: Fix Hotseat manual seat switch breaking next turn (stale closure hazard in interaction controller).
- 2026-02-22: task(0218) Restrict passTilePlacement to final-settlement conditions (no “skip placement” during normal turns).
- 2026-02-22: task(0209) UI: Inspector selection works consistently (inspect always, except Hard-Gate).
- 2026-02-22: task(0207) Engine: Make PersonalSupply zones public in playerView (fix misleading 0 counts for opponents).
- 2026-02-22: task(0206) UI: Ensure influence marker labels are not occluded by adjacent tiles (z-index fix).
- 2026-02-21: task(0192) Align `enumerateConvertResources` with spec variants (typed/untyped) using shared mechanics (CORE-01-04-22).
- 2026-02-21: task(0191) Ensure hotspot "prohibited" still marks resolved (CORE-01-06-03B, CORE-01-06-04(c)).

- 2026-02-21: task(0190) Ensure `placeInfluence` is illegal if PersonalSupply has no Influence (CORE-01-04-11A); validate before costs.
- 2026-02-21: task(0189) Ensure `placeTile` atomicity: validate legality (CORE-01-04-05) before cost payment (CORE-01-06-00-03, ARCH-03:RESOLUTION_ORDER).
- 2026-02-21: task(0187) Align DrawPile behavior with CORE-01-00-05A: Top = first element (index 0).
- 2026-02-20: task(0148) Rename Meta-Marker mode `PingPong` to `ReturnPenalty` (CORE rename and serialization change).
- 2026-02-19: task(0138) Remove deprecated `CoreZoneNames` and `CoreResources` exports from `@balance-control/rules` (API cleanup).
- 2026-02-18: task(0112) Migrate `packages/client-web` to `type: module` and configure TS paths for source resolution (IDE support).
- 2026-02-18: task(0106) Fix E2E board-viewport test by bypassing start screen; fix server tsconfig rootDir.
- 2026-02-17: task(0100) Lock enabled packs in match meta, hash public surface, and validate replays against mismatched surfaces.
- 2026-02-17: task(0096) Renumber tasks 0097-0101 to 0102-0106 to make room for Pack-System insertion (0097→0102, 0098→0103, 0099→0104, 0100→0105, 0101→0106).
- 2026-02-17: task(0097) Remove legacy registry alias usage, centralize pack assembly, and enforce duplicate move detection.
- 2026-02-17: task(0093) Extract CORE into mandatory `CorePack` (setup hooks, core moves, and core atom registrations) and wire SetupGame + EffectResolver through the pack (mechanical; no semantic changes).
- 2026-02-17: task(0092) Introduce core-capable EnginePackRegistry + pack contract types; keep ExpansionRegistry as deprecated compatibility shim (mechanical; no semantic changes).
- 2026-02-17: task(0090) Unblock `packages/client-web` build (TypeScript strict fixes; browser-safe `hashState` hashing; Vite aliases for expansions).
- 2026-02-17: task(0085) Split core moves into stage/system modules under `packages/game/src/moves/` (mechanical; no semantic changes).
- 2026-02-16: task(0081) Normalize expansion move assembly: canonical module order + config-only enablement + duplicate-move detection (mechanical; no semantic changes).
- 2026-02-16: task(0080) Split `packages/game/src/engine/resolver.ts` into focused modules under `packages/game/src/engine/atoms/` and `packages/game/src/engine/resolver/` (mechanical; no semantic changes).
