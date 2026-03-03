# DD-0322 — Hotseat replay forwarding and workspace-root log path

- Status: Accepted
- Date: 2026-03-03
- Deciders: Engine/Server maintainers

## Context

Replay-Logs wurden bisher relativ zum aktuellen Working Directory abgelegt. Beim Start aus `packages/server` entstanden Artefakte unter `packages/server/log/...` statt im repo-weiten `log/...` Verzeichnis.

Zusätzlich erzeugt der Local-Hotseat-Modus keine Server-Moves und damit keine Dateireplays.

## Decision

1. Der Default-Replaypfad wird unabhängig vom CWD auf `<workspace-root>/log/replay` gesetzt.
2. Der Server stellt eine Ingest-Route `/api/replay/hotseat` bereit, die `ReplayActionRecord` entgegennimmt und in denselben `ReplaySink` schreibt wie Multiplayer-Moves.
3. Der Hotseat-Client erzeugt ein Game mit Replay-Hook und leitet Records best-effort an diese Route weiter (`sendBeacon`, fallback `fetch`).

## Consequences

- Replay-Artefakte sind zentral unter `log/replay` auffindbar.
- Hotseat und Online landen im selben Logging-Kanal.
- Bei nicht erreichbarem Server bleibt Hotseat spielbar; Forwarding-Fehler sind best-effort und beeinflussen keine Spielregeln.
