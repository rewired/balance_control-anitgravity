# Codex Task 0031 — CORE-01 v1.0.20 Inventory + Delta Map

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Rules source of truth: AGENTS 0.1
* Determinism: AGENTS 0.2
* Canonical resolver order: AGENTS 3.5, ARCH-03
* State shape: ARCH-02

---

## Goal

Produce an authoritative inventory of the current CORE-01 v1.0.14 implementation and a structured delta map from v1.0.14 to v1.0.20 with explicit rule citations.

---

## Inputs

* Deprecated spec: `docs/rules/000-core-depreicated.md` (CORE-01 v1.0.14)
* Target spec: `docs/rules/000-core.md` (CORE-01 v1.0.20)
* Architecture contracts: `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`, `ARCH-02-STATE-SHAPE.md`, `ARCH-03-MEASURE-CPU.md`, `ARCH-04-LLM-BOT-CONTRACT.md`
* Current implementation files:
  * Rules/types: `packages/rules/src/index.ts`
  * Setup/state: `packages/game/src/setup.ts`
  * Turn + staging: `packages/game/src/index.ts`, `packages/game/src/mechanics-turn.ts`
  * Core moves: `packages/game/src/moves.ts`
  * Resolver/effects: `packages/game/src/engine/resolver.ts`
  * Majority: `packages/game/src/mechanics.ts`
  * Legal intents: `packages/game/src/engine/legal-intents.ts`
  * Topology: `packages/game/src/topology.ts`
  * Tests: `packages/game/test/*.test.ts` (moves, legal-intents, production, hotspot, turn, golden-replay)

---

## Outputs

### A) Inventory (current v1.0.14 alignment)

* Core rules state lives in `packages/rules` with zones, tiles, objects, and core enums.
* Engine execution lives in `packages/game` with:
  * `setup.ts` composing initial zones, tiles, and starting Influence.
  * `moves.ts` for political actions and DrawAndPlace.
  * `engine/resolver.ts` for effects and production resolution.
  * `engine/legal-intents.ts` for authoritative legality enumeration.
  * `mechanics.ts` for `computeMajority`.
  * `index.ts` for turn structure + Round Settlement.
* UI uses `enumerateLegalIntents` but must not compute legality itself (ARCH-01).

### B) Current alignment gaps vs v1.0.20 (high-level)

* No Meta-Marker object or lifecycle in state.
* No PingPong/Shift/Convert modes or expiry handling.
* ConvertResources lacks control requirement, repeat penalty, and anchor semantics.
* PlaceOrMoveInfluence lacks Meta-Marker placement and PingPong classification.
* Production lacks PingPong reduction step.
* Start Committee connectivity/pass-through/targeting restrictions not fully encoded.

### C) Delta Map (v1.0.14 → v1.0.20) with rule references

#### State Model changes

* Meta-Marker object introduced with zone constraints and Start Committee exception: CORE-01-02-17A–17D (`000-core.md` L96–L99).

#### Turn Structure changes

* PlaceOrMoveInfluence (Move) meta-marker placement: CORE-01-04-12A (`000-core.md` L132–L135).
* Ping-Pong classification and mode assignment: CORE-01-04-12B (`000-core.md` L136–L139).
* Meta-Marker expiry timing for Move: CORE-01-04-12C (`000-core.md` L141–L143).
* ConvertResources output unit default: CORE-01-04-22A (`000-core.md` L156–L159).
* ConvertResources control requirement: CORE-01-04-22B (`000-core.md` L160–L162).
* ConvertResources repeat penalty (Meta-Marker): CORE-01-04-22C (`000-core.md` L164–L166).
* ConvertResources anchor selection: CORE-01-04-22D (`000-core.md` L168–L170).
* ConvertResources meta-marker placement + mode: CORE-01-04-22E (`000-core.md` L172–L175).
* ConvertResources meta-marker expiry timing: CORE-01-04-22F (`000-core.md` L176–L178).

#### Action legality changes

* ConvertResources legal only if player controls ≥1 Grassroots: CORE-01-04-22B (`000-core.md` L160–L162).
* Start Committee cannot be source or destination of PlaceOrMoveInfluence: CORE-01-08-06E (`000-core.md` L324–L326).

#### Control / majority computation changes

* No change detected between v1.0.14 and v1.0.20.

#### Effect resolution / ordering changes

* Production output includes Ping-Pong reduction step: CORE-01-06-16(a)4 (`000-core.md` L263–L269).

#### Round settlement / production changes

* Round start returns expiring Meta-Markers: CORE-01-07-03A (`000-core.md` L287–L288).
* Meta-Marker duration limit for round: CORE-01-07-03B (`000-core.md` L290–L291).

#### Restrictions changes

* Start Committee adjacency connectivity clarification: CORE-01-08-06C (`000-core.md` L316–L318).
* Start Committee pass-through prohibition for Influence: CORE-01-08-06D (`000-core.md` L320–L322).
* Start Committee targeting restriction: CORE-01-08-06E (`000-core.md` L324–L326).

---

## Constraints

* Core-only migration unless v1.0.20 explicitly touches expansion interfaces.
* No rule drift; cite exact rule IDs for all changes.
* Preserve deterministic state transitions (ARCH-01, ARCH-03).

---

## Invariants

* Engine-only authority for legality, costs, majority, and modifiers.
* Canonical zone model per ARCH-02.
* `enumerateLegalIntents` remains the only bot interface (ARCH-04).

---

## Acceptance Criteria

1. Inventory lists the current authoritative files for rules, moves, resolver, legality, and tests.
2. Delta map enumerates every v1.0.20-only change with line references.
3. No expansion behavior is modified in this task.

---

## PR Checklist

* [ ] Inventory captured in this task file
* [ ] Delta map complete with rule citations
* [ ] No expansion rules modified
* [ ] `docs/PR_TASK_LIST.md` updated (add Task 0031)
