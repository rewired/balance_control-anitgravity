# DD-0326 — Replay v1: `system.roundSettlement` Recordtyp für engine-getriebene Abrechnung

## Context

DD-0312 hat Replay v1 zunächst auf `header`/`action`/`checkpoint`/`footer` begrenzt. In der Engine existieren jedoch deterministische, **nicht durch einen Spielerzug ausgelöste** Settlement-Pfade (reguläres Round-Ende und Auto-Final-Settlement). Diese Übergänge fehlen im Replay-Log als eigenständige Semantik, was Diagnose/Verifikation erschwert.

## Decision

1. Extend Replay v1 body record taxonomy with `recordType: "system.roundSettlement"`.
2. Fix deterministic payload schema:
   - `roundNumber: number`
   - `settlementKind: "regular" | "final"`
   - `resortTileOrder: string[]` (canonical processing order)
   - optional `stateHash: string` only when `includeStateHash` is enabled.
3. Emit this record deterministically from both engine settlement paths:
   - regular round settlement at turn end
   - auto final settlement on turn begin when end condition is met.
4. Keep action sequencing unchanged: `action.seq` remains contiguous over action records only; system records are ordered by deterministic emission position and carry no timestamps/IDs.

## Consequences

- Replay traces preserve deterministic engine-side settlement semantics without inventing phantom player actions.
- Verifier can accept and validate settlement payload shape while replay execution continues to be action-driven.
- DD-0312 is superseded for the record-type list (serialization constraints remain in force).
