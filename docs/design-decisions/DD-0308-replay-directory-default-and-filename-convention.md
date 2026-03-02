# DD-0308 — Replay logging default directory and filename convention

## Status
Accepted

## Context
Task 0306 introduced a v1 logging config contract with a replay subtree. Follow-up housekeeping requires an explicit default replay directory, robust ignore patterns, and a canonical replay filename pattern that supports deterministic artifact routing in local and automated environments.

## Decision
1. Keep `logging.replay.directory` defaulted to `./log/replays` in the v1 logging specification.
2. Standardize replay filenames as `<matchId>-<yyyyMMddTHHmmssZ>-<seed>.replay.ndjson`.
3. Require that `logging.replay.directory` remains configurable per runtime environment (local, CI, server).
4. Add operator guidance that replay outputs should not be written under `docs/` or `packages/`.
5. Add repository ignore patterns for replay artifacts:
   - `var/replays/**`
   - `*.replay.ndjson`

## Consequences
- Replay logs are routed to runtime-oriented storage by default, reducing accidental repository pollution.
- Deterministic file naming supports indexing and post-run automation.
- Configuration remains deployment-flexible while discouraging writes into source/documentation trees.
