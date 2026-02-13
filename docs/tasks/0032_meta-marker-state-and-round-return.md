# Codex Task 0032 — Meta-Marker State + Round Return

**Date:** 2026-02-13  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* State shape: ARCH-02
* Determinism: AGENTS 0.2
* Meta-Marker definitions: CORE-01-02-17A–17D
* Round return: CORE-01-07-03A–03B

---

## Goal

Introduce Meta-Marker objects into authoritative state, with deterministic lifecycle and round-start return behavior per CORE-01 v1.0.20.

---

## Inputs

* CORE-01-02-17A–17D (`000-core.md` L96–L99)
* CORE-01-07-03A–03B (`000-core.md` L287–L291)
* Current state model: `packages/rules/src/index.ts`
* Setup + turn lifecycle: `packages/game/src/setup.ts`, `packages/game/src/index.ts`
* UI token rendering: `packages/client-web/src/components/Token.tsx`

---

## Outputs

1. **Rules/types**  
   * Add a Meta-Marker object type in `GameObject` with fields needed for:
     * `owner` (playerId)
     * `mode` (PingPong | Shift | Convert)
     * expiry tracking compatible with round-start return
2. **Setup**  
   * Create exactly one Meta-Marker per player in `PersonalSupply:<playerId>` at game start.
3. **Placement and storage**  
   * Meta-Markers exist in exactly one zone at any time:
     * `PersonalSupply:<playerId>` or a Tile zone in Board.
   * Allow Meta-Markers on the Start Committee (CORE-01-02-17D).
4. **Round-start return**  
   * At the beginning of each Round, before any player turn, return Meta-Markers that expire this Round to owner’s PersonalSupply (CORE-01-07-03A).
   * Ensure a Meta-Marker placed in a Round is returned at the beginning of the next Round (CORE-01-07-03B).
5. **UI**  
   * Render Meta-Markers in the client token component with a distinct class or label (no gameplay logic).

---

## Constraints

* No new zones are introduced for Meta-Markers.
* Round-start return must be deterministic and authoritative in `packages/game`.
* Do not modify expansions unless they require Meta-Marker presence.

---

## Invariants

* Exactly one Meta-Marker per player exists at all times.
* Meta-Markers are not Influence, Resources, or Overlays.
* Meta-Markers never affect state hash unless their state actually changes.

---

## Acceptance Criteria

1. Game setup creates Meta-Markers for each player and stores them in PersonalSupply.
2. Round-start hook returns expiring Meta-Markers to PersonalSupply deterministically.
3. Client renders Meta-Markers without adding logic outside the engine.
4. Unit tests cover:
   * Initial Meta-Marker placement.
   * Return at round start.

---

## PR Checklist

* [ ] Add Meta-Marker object type and fields
* [ ] Create one Meta-Marker per player at setup
* [ ] Implement round-start return step
* [ ] Render Meta-Markers in client UI
* [ ] Add unit tests for placement + return
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0032)
