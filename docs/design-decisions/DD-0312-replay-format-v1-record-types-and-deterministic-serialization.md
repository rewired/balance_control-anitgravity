# DD-0312 — Replay-Format v1: Record-Typen und deterministische Serialisierung

## Context

Die bestehende v1-Konfiguration (`logging.replay`) definiert den Aktivierungs- und I/O-Rahmen, aber nicht das konkrete Replay-Datensatzmodell pro NDJSON-Zeile. Für robuste Replay-Parser, deterministische Vergleiche und spätere Tooling-Interoperabilität wird ein expliziter v1-Recordvertrag benötigt.

## Decision

1. Introduce `docs/replay-format-v1.md` as normative Replay Format v1 specification.
2. Define exactly four record types for v1:
   - `header`
   - `action`
   - `checkpoint` (optional MVP)
   - `footer`
3. Fix required field sets:
   - `header`: `schemaVersion`, `seed`, `matchConfig`, `expansions`
   - `action`: `seq`, `player`, `moveType`, `args`, `turn`, `phase`
   - `checkpoint`: `stateHash`
   - `footer`: `finalStateHash`, `totalActions`
4. Require deterministic serialization:
   - stable key ordering (lexicographic, recursive)
   - no pretty-printing (one-line NDJSON records)
   - no replay-relevanten Zeitwerte im Payload

## Consequences

- Replay files become versionable and parser-stable at record level.
- Determinism checks (`stateHash`/`finalStateHash`) can rely on canonical payload shape.
- Runtime/logging config remains separated from replay record semantics while linking to the new norm document.
