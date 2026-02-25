# Task 0275 — Game tests fail due to duplicate pack registration state leakage

**Date:** 2026-02-25
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0275-game-tests-fail-pack-registry-duplicate-registration`

---

**Task State:** DRAFT

## 0) Failure Block

### Thematic cluster

* `packages/game` pack-registry and move-assembly related suites.

### First causal error (non-follow-up)

* `Error: EnginePackRegistry: pack "exp01" already registered.`

### Affected paths/modules

* `packages/game/src/expansion-registry.ts`
* `packages/game/test/engine-pack-registry.test.ts`
* `packages/game/test/move-assembly-invariants.test.ts`
* `packages/game/test/pack-disablement-isolation.test.ts`
* `packages/game/test/pack-registry-setup.test.ts`
* `packages/game/test/measure-dispatch-collision.test.ts`

### Guardrails

* GR-002
* GR-003
* GR-012

### Reproducible command

* `pnpm -w test`

### Expected behavior

* Game test suites can register packs deterministically per test without cross-test leakage.
* `pnpm -w test` progresses past pack-registry suites.

### Actual behavior

* Multiple suites fail because a previously-registered pack remains present, causing deterministic duplicate-pack rejection before assertions run.
