# DD-0267 — Legal-intent stage authority and conservative draw fallback

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0267

## Context

`enumerateLegalIntents` previously used `inferStageBestEffort` as a regular fallback whenever `ctx.activePlayers[playerID]` was missing. In mixed or stale snapshots this could classify the player as `politicalAction` and emit political intents (`placeInfluence`, `moveInfluence`, `formalizeInfluence`, `convertResources`) while the real turn flow was still draw-stage.

## Decision

1. Treat `ctx.activePlayers[playerID]` as the authoritative stage when `ctx.activePlayers` exists.
2. Use `inferStageBestEffort` only when `ctx.activePlayers` is completely unavailable.
3. Expand draw indicators in `inferStageBestEffort` and return `drawAndPlace` for ambiguity.
4. Prefer false negatives (missing political intents) over false positives (illegal political intents during draw).

## Rationale

- Aligns legality with engine-owned stage authority (ARCH-01).
- Prevents phantom/intents-at-wrong-time failures by conservative gating.
- Keeps deterministic, pure enumeration behavior intact.

## Consequences

- If `ctx.activePlayers` exists but contains no usable stage for a player, legal-intent enumeration suppresses political moves by default.
- Best-effort inference remains available for non-standard test harnesses and legacy snapshots with no `activePlayers` object.
