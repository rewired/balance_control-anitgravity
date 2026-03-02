# DD-0319 — Canonical Bot Seat Configuration Across Hotseat and Multiplayer

## Status
Accepted

## Context
Task 0319 requires a canonical, strict configuration shape for per-seat human/bot assignment and bot model/provider options. Prior to this decision, seat/bot configuration had no canonical schema in `GameConfig`, and start flows (hotseat vs lobby multiplayer) did not share a validated builder path.

## Decision
1. Extend `GameConfig` with optional `seats` map keyed by seat id (`"0"`, `"1"`, ...).
2. Define canonical seat schema:
   - Human seat: `{ role: "human" }`
   - Bot seat: `{ role: "bot", provider: "ollama", model: string, decoding?, timeouts? }`
3. Enforce strict parsing in `normalizeGameConfig` with zod-based validation and explicit error on invalid shape.
4. Add a shared client builder that constructs and validates setupData via `normalizeGameConfig` before using it in:
   - Hotseat local match start
   - Multiplayer lobby `createMatch` start

## Determinism / Guardrails
- Keeps authoritative config in canonical setup path (`normalizeGameConfig`) and avoids ad-hoc parsing branches (GR-012).
- No state mutations outside normal engine move/setup lifecycle (GR-001/GR-002/GR-003 unaffected).
- Bot config is declarative setup only; no runtime rule bypass.

## Consequences
- UI now offers start presets for Mensch vs KI and KI vs KI.
- Invalid seat/provider/model input is rejected deterministically at normalization time.
- Server and client consume the same setup contract via shared normalization logic.
