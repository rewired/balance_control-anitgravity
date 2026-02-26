# DD-0311 — Verbindliches Replay-Konfigdokument + `conf.example.json`

- **Status:** Accepted
- **Date:** 2026-02-26
- **Deciders:** Maintainers
- **Related artifacts:** `docs/logging-config-v1.md`, `conf.example.json`

## Context

Das bestehende Logging-v1-Dokument enthält bereits breit gefächerte Regeln, aber Teams benötigen zusätzlich eine klar priorisierte, verbindliche Minimaldefinition für den lokalen Start.

## Decision

1. `docs/logging-config-v1.md` enthält einen expliziten normativen Minimalabschnitt für den v1-Teilbaum `logging.replay`.
2. Der Minimalabschnitt definiert Root-Feld (`configVersion`), Pflicht-/Optionalfelder, Defaultwerte, Override-Reihenfolge (`CLI > ENV > conf.json > Defaults`), ENV-Mapping und fail-fast-Fehlerverhalten.
3. Es wird eine sofort nutzbare Beispielkonfiguration `conf.example.json` im Repo-Root bereitgestellt.

## Consequences

### Positive

- Teams können ohne Rückfragen lokal starten (`conf.example.json` kopieren und bei Bedarf anpassen).
- Implementierungen haben einen kompakten, verbindlichen Referenzabschnitt zusätzlich zur vollständigen Spezifikation.
- Fehlkonfigurationen bleiben deterministisch und früh sichtbar (fail-fast, klare Meldungen).

### Trade-offs

- Das Repo enthält nun sowohl eine vollständige Spezifikation als auch einen priorisierten Minimalabschnitt und muss beide konsistent halten.
