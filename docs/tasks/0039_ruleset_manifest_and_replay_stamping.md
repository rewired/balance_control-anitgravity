# Codex Task 0039 — Ruleset Version Manifest + Replay/State Stamping

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Make every game state and replay self-describing: which CORE/EXP versions were in effect.
This enables long-term auditing ("was that bug under v1.0.26 or v1.1.0?") without guesswork.

## Inputs
- Canonical rules docs in /docs/rules/
- Anchor registry from Task 0038 (or implement it first)
- Replay export/import tooling (existing)

## Outputs
1) Add a RulesetManifest structure (JSON or TS constant) that includes:
- coreVersion: "v1.1.0"
- expansions:
  - exp01Version (if enabled/available)
  - exp02Version
  - exp03Version
- specAnchorHash (optional but recommended):
  - derive from the anchor registry content
  - must be stable across machines

2) Store manifest snapshot in authoritative game state:
- e.g. G.meta.ruleset (or equivalent canonical place)
- must not include non-deterministic values

3) Ensure replay export includes the manifest as part of replay metadata.

4) Backward compatibility:
- If older replays do not have a manifest, treat as "unknown" but do not crash.
- Replay runner should still work for older fixtures.

5) Add tests:
- Manifest exists in new games.
- Manifest remains stable across identical seeds/moves.
- Exported replays contain the manifest.
- Older replays without manifest still load.

## Constraints
- No filesystem reads at runtime in production engine.
- No timestamps or environment-dependent values in manifest.
- Do not change replay format more than necessary.

## Invariants
- Engine determinism preserved: same seed + same moves => same hashes + same manifest.
- Client remains non-authoritative.

## Acceptance
- pnpm -r test passes.
- At least one golden replay fixture demonstrates manifest presence.
- Backward-compat replay fixtures still pass.

## PR Checklist
- [ ] Manifest added
- [ ] State stamping implemented
- [ ] Replay stamping implemented
- [ ] Backward-compat handled
- [ ] Tests updated + new golden fixture
- [ ] Changelog updated
- [ ] CI green
