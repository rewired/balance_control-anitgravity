# Replay Format v2

Canonical order:
1. `header`
2. `manifest`
3. event records (`action`, `system.choiceOpened`, `system.hotspotResolved`, `system.roundSettlement`, `checkpoint.turnEnd`, `checkpoint.roundEnd`)
4. `footer`

`header` carries static setup metadata (`schemaVersion: "2"`, `format`, `seed`, `matchConfig`, `expansions`, `loggingMode`) and MUST NOT be duplicated on body event records.

## `action` record invariants

For `moveType: "placeInfluence"`, replay emission projects authoritative influence counts for the acting player from engine state and records them in `resolved.influence`:

- `pre.personalSupply`
- `pre.board`
- `post.personalSupply`
- `post.board`
- `expectedDelta` (`{ personalSupply: -1, board: +1 }`)
- `observedDelta`

Validation rules:

- If `resolved.outcome === "applied"`, validators MUST enforce:
  - `post.personalSupply === pre.personalSupply - 1`
  - `post.board === pre.board + 1`
- If the invariant fails during replay emission, the sink writes a deterministic `action` error record with:
  - `resolved.outcome: "error"`
  - `resolved.errorCode: "PLACE_INFLUENCE_INVARIANT_FAILED"`
  - `resolved.influence` containing `pre`, `post`, `expectedDelta`, and `observedDelta`

This invariant lets replay/tooling reject inconsistent checkpoints deterministically instead of silently accepting drift.
