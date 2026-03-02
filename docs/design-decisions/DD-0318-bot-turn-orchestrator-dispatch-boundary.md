# DD-0318 — Bot Turn Orchestrator mit Dispatch-Boundary und Loop-Guards

## Status
Accepted — 2026-03-02

## Kontext
Nach DD-0317 existiert ein dedizierter Ollama-Transport und ein deterministischer Auswahlpfad (`enumerateDeterministicLegalMoves` → strict JSON parse → index-basierte Intent-Selektion). Es fehlt jedoch eine wiederverwendbare Orchestrierung für den vollständigen KI-Zugzyklus, die sowohl serverseitig (Multiplayer) als auch lokal (Hotseat) identisch eingebunden werden kann, ohne Engine-Bypass.

ARCH-04 verlangt dabei weiterhin:
1. Auswahl ausschließlich aus legal enumerierten Intents.
2. Keine freie Move-Konstruktion.
3. Deterministische Fallbacks.

## Entscheidung
Wir führen `runTurnOrchestrator(...)` in `packages/bot-llm/src/turn-orchestrator.ts` ein mit folgenden Eigenschaften:

1. **Einheitlicher Ablauf pro Bot-Aktion:**
   - `selectIntentWithOllama(...)` (inkl. `enumerateDeterministicLegalMoves` + Ollama-Request + `selectIntentFromLLMResponse`)
   - Dispatch nur über Host-Callback `dispatchIntent(intent, context)`
2. **Klare Integrationsgrenze:**
   - Host (Server/Client) bleibt für tatsächlichen Engine-Commit verantwortlich.
   - Optionaler Snapshot-Callback (`getLatestSnapshot`) liefert aktualisiertes `G`/`ctx` für die nächste Iteration.
3. **Loop-Guards für KI-vs-KI:**
   - `maxTurns` begrenzt abgeschlossene Bot-Turns pro Orchestrator-Lauf.
   - `maxConsecutiveBotActions` begrenzt fortlaufende Bot-Dispatches.
4. **Deterministische Stop-Gründe als Report:**
   - z. B. `no-legal-moves`, `active-player-not-bot`, `max-turns-reached`, `max-consecutive-bot-actions-reached`.

## Konsequenzen
- Server- und Hotseat-Integration können denselben Orchestrator ohne Doppelimplementierung nutzen.
- Kein Verstoß gegen GR-005/GR-013, da weiterhin ausschließlich legal enumerierte Intents dispatcht werden.
- KI-vs-KI-Szenarien sind gegen unendliche Schleifen auf Orchestrator-Ebene geschützt.
