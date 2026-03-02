# DD-0321 — Client Bot Runner Wiring for Hotseat and Lobby Seat Semantics

## Context

Task 0321 integrates the existing deterministic `runTurnOrchestrator(...)` into `client-web` runtime flows. Prior behavior had canonical seat config (`G.meta.cfg.seats`) but no automatic bot turn execution in client runtime surfaces.

## Decision

1. Add a client bridge module that:
   - derives bot seats exclusively from `G.meta.cfg.seats`,
   - maps orchestrator dispatch through existing boardgame.io move handlers,
   - exposes deterministic loop guards (`maxTurns`, `maxConsecutiveBotActions`) for safety.
2. Wire the bridge into:
   - `HotseatShell` local client lifecycle,
   - `App` online match client lifecycle.
3. Lobby UX rule:
   - seats marked `role=bot` are displayed as `Bot (auto)` and are not rendered with join buttons.

## Rationale

- Preserves engine authority and legality surface: client does not invent actions; orchestrator dispatches legal intents only.
- Keeps deterministic constraints explicit with fixed loop-guard defaults.
- Aligns online lobby semantics with canonical seat config so bot seats are not treated as human-join-required.

## Consequences

- Bot execution becomes host-agnostic via a single bridge in `client-web`.
- Misconfigured or missing bot seat config causes orchestrator no-op rather than implicit fallbacks.
- Online bot execution still depends on runtime dispatch permissions of the connected client/server session policy.
