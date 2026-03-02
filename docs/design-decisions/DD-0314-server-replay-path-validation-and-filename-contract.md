# DD-0314 — Server replay path validation and filename contract wiring

## Kontext

Replay-v1 Dokumentation definiert bereits den Default-Pfad `./log/replays` und eine Dateinamenkonvention. Nach Task 0313 existiert ein Engine-Hook (`ReplaySink`), aber im Server fehlte noch die Laufzeitverdrahtung für Dateiausgabe inklusive robuster Pfadvalidierung und Start-up-Verzeichniserzeugung.

## Entscheidung

1. Verdrahte den Server-Start auf `createBalanceControlGameWithHooks(...)` mit einem NDJSON-Datei-`ReplaySink`.
2. Setze den Default-Ausgabepfad weiterhin auf `./log/replays`, übersteuerbar via ENV `BC_REPLAY_DIRECTORY`.
3. Validiere den konfigurierten Replay-Pfad fail-fast:
   - leere Werte und Null-Bytes sind verboten,
   - relative Path-Traversal-Segmente (`..`) sind verboten,
   - Fehlermeldungen benennen den konkreten Pfadgrund.
4. Erzeuge das Replay-Verzeichnis beim Start deterministisch via `mkdir(..., { recursive: true })`.
5. Implementiere Dateinamenkonvention mit `matchId`, `seed`, `timestamp`:
   - `<matchId>-<seed>-<yyyyMMddTHHmmssZ>.replay.ndjson`
   - ungültige Zeichen werden für Dateisystem-Sicherheit kanonisch durch `_` ersetzt.
6. Erweitere Replay-Action-Records um optionale Metadatenfelder (`matchId`, `seed`) zur Dateibenennung.

## Konsequenzen

- Replay-Dateien werden ohne zusätzliche Operator-Schritte in `./log/replays` erzeugt.
- Unsichere relative Pfade werden früh mit klaren Fehlern abgewiesen, statt implizit normalisiert zu werden.
- Die Engine bleibt filesystem-frei; Dateiausgabe ist weiterhin im Server-Infrastruktur-Layer gekapselt.
