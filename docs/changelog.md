# Changelog — BALANCE // CONTROL

## Unreleased

- 2026-02-16: task(0080) Split `packages/game/src/engine/resolver.ts` into focused modules under `packages/game/src/engine/atoms/` and `packages/game/src/engine/resolver/` (mechanical; no semantic changes).
- 2026-02-16: task(0081) Normalize expansion move assembly: canonical module order + config-only enablement + duplicate-move detection (mechanical; no semantic changes).
- 2026-02-17: task(0085) Split core moves into stage/system modules under `packages/game/src/moves/` (mechanical; no semantic changes).
- 2026-02-17: task(0090) Unblock `packages/client-web` build (TypeScript strict fixes; browser-safe `hashState` hashing; Vite aliases for expansions).
- 2026-02-17: task(0092) Introduce core-capable EnginePackRegistry + pack contract types; keep ExpansionRegistry as deprecated compatibility shim (mechanical; no semantic changes).
- 2026-02-17: task(0093) Extract CORE into mandatory `CorePack` (setup hooks, core moves, and core atom registrations) and wire SetupGame + EffectResolver through the pack (mechanical; no semantic changes).
- 2026-02-17: task(0097) Remove legacy registry alias usage, centralize pack assembly, and enforce duplicate move detection.
- 2026-02-17: task(0096) Renumber tasks 0097-0101 to 0102-0106 to make room for Pack-System insertion (0097→0102, 0098→0103, 0099→0104, 0100→0105, 0101→0106).
