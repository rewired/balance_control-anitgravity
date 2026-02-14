# Codex Task 0040 — CORE-01 Compliance Invariants (High-Risk Rules as Tests)

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Canonical effect resolver: AGENTS 3.5
- Production order: AGENTS 3.6
- Start Committee immunity: AGENTS 3.7
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Convert the most failure-prone CORE rules into hard tests (unit + golden).
Focus on rules that are often implemented "almost right".

## Inputs (rule anchors)
- CORE-01 Zone/State model sections
- Start Committee restrictions + immunity
- ConvertResources legality + repeat-penalty rules
- Ping-pong production reduction rules
- Influence hard cap rules
- ADD56-01 overrides where relevant

## Outputs
Add/extend tests covering at least the following invariant families:

### 1) Zone Exclusivity
- Every object exists in exactly one zone at all times.
- No duplicates across zones.
- Removal/movement preserves this invariant after every move/effect.

### 2) Start Committee Hard Gates
- Influence cannot be placed or moved onto Start Committee.
- Start Committee cannot be controlled.
- Start Committee is immune to effects (as specified).
- IMPORTANT: if any non-Influence markers are allowed there by spec, do not over-forbid.

### 3) ConvertResources Legality + Repeat Penalty
- Convert is legal only if at least one controlled Grassroots exists.
- Repeat penalty applies based on "repeating Convert within a turn" rules:
  - must match CORE wording (and any streamlined updates in v1.1.0)
- Repeat penalty must apply regardless of which controlled Grassroots the marker stands on.

### 4) Ping-Pong Production Reduction
- When in ping-pong state/mode, production is reduced to 50% rounded down.
- Respect any caps explicitly defined in CORE (e.g., max 10 after reduction, if specified).

### 5) Influence Cap
- Hard cap enforced per player.
- If ADD56-01 changes caps for 5-6 players, add test cases for those configs.

### 6) Canonical Production/Resolution Order
- At end-of-round production (and other multi-step resolution) must follow canonical order exactly.
- Add at least one golden replay that exercises:
  - a Hotspot/trigger chain (if applicable)
  - convert-repeat penalty
  - ping-pong reduction

## Constraints
- No new mechanics. Only enforce what the rules specify.
- Tests must be deterministic: fixed seeds, stable IDs, stable hashes.
- Prefer minimal fixtures: one test = one rule family.

## Invariants
- Engine authority and determinism are non-negotiable.

## Acceptance
- pnpm -r test passes.
- At least one new golden replay fixture added that covers:
  - start-committee gate edge case
  - convert-repeat penalty edge case

## PR Checklist
- [ ] Invariant tests added
- [ ] Golden fixtures added/updated
- [ ] Changelog updated
- [ ] CI green
