# Changelog — BALANCE // CONTROL

## Unreleased

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
