# Codex Task 0035 — Production PingPong Reduction

**Date:** 2026-02-13  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Production order: CORE-01-06-16
* PingPong reduction: CORE-01-06-16(a)4
* Prohibition handling: CORE-01-06-17

---

## Goal

Implement PingPong production reduction and cap in the canonical production order.

---

## Inputs

* CORE-01-06-16(a)4 (`000-core.md` L263–L269)
* CORE-01-06-17 (`000-core.md` L278)
* Production resolver: `packages/game/src/engine/resolver.ts`
* Majority helper: `packages/game/src/mechanics.ts`
* Expansion production modifiers: `packages/game/src/expansion-registry.ts`
* Production tests: `packages/game/test/production-*.test.ts`

---

## Outputs

1. **PingPong reduction step**
   * If the controlling player’s Meta-Marker mode is PingPong, reduce production output to 50% (rounded down) and cap at 10.
2. **Canonical order**
   * Apply PingPong reduction after output modifiers and before floors, per CORE-01-06-16(a)1–5.
3. **No-control handling**
   * If no controller exists (tie/no control), PingPong reduction does not apply.
4. **Prohibition handling**
   * Production prohibited by effect-level rules yields output 0 regardless of PingPong reduction (CORE-01-06-17).
5. **Tests**
   * Unit tests for:
     * PingPong reduction amount and cap
     * No reduction when controller missing
     * Interaction with output modifiers and floors

---

## Constraints

* Production order must remain canonical and deterministic.
* Meta-Marker lookup must not introduce derived caches in state.

---

## Invariants

* Reduction never increases output.
* Remainders from tie splits still go to Noise after reduction.

---

## Acceptance Criteria

1. PingPong reduction applied only when controller has Meta-Marker mode PingPong.
2. Reduction rounds down and caps at 10.
3. Production tests validate reduction and tie/no-control behavior.

---

## PR Checklist

* [ ] Implement PingPong reduction in production resolver
* [ ] Preserve canonical production order
* [ ] Add production tests for PingPong reduction
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0035)
