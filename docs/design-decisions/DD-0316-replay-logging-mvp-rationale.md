# DD-0316 — Replay Logging MVP: Begründung, NDJSON, Konfig-Priorität und Logpfad-Sicherheitsregeln

- **Status:** Accepted
- **Date:** 2026-02-26
- **Deciders:** Maintainers
- **Related artifacts:** `docs/logging-config-v1.md`, `docs/replay-format-v1.md`, `docs/design-decisions/DD-0310-config-contract-v1-logging-replay.md`, `docs/design-decisions/DD-0312-replay-format-v1-record-types-and-deterministic-serialization.md`, `docs/design-decisions/DD-0314-server-replay-path-validation-and-filename-contract.md`

## Kontext

Für das Replay-Logging liegt bereits ein technischer Teilstand vor (Konfigvertrag, Replay-Format, Server-Verdrahtung). Für die Dokumentations- und Governance-Sicht fehlte jedoch eine kompakte, in einem Dokument gebündelte MVP-Begründung für drei Kernfragen:

1. Warum `logging.replay` als kanonischer Namespace,
2. warum NDJSON als v1-Format,
3. welche Priorität bei Konfigquellen gilt und welche Sicherheitsregeln für Logpfade verpflichtend sind.

Diese DD/ADR schließt diese Lücke und fasst die normative Entscheidungslogik für das MVP zusammen.

## Entscheidung

### 1) Begründung für `logging.replay`

`logging.replay` ist der verbindliche Namespace für Replay-Logging-Konfiguration im MVP.

**Rationale:**

- Replay-Logging ist eine Logging-Subdomäne, kein eigener Root-Bereich.
- Der Namespace bleibt kompatibel mit der reservierten Root-Struktur (`logging` als übergeordneter Bereich).
- Die Struktur vermeidet Drift zwischen JSON-, ENV- und CLI-Abbildung.
- Erweiterungen (z. B. weitere Logging-Facetten) bleiben kohärent unter einem stabilen Präfix.

### 2) Begründung für NDJSON

Das MVP fixiert `logging.replay.format` auf `ndjson`.

**Rationale:**

- Zeilenweiser Event-Stream unterstützt append-only Schreiben und robuste Verarbeitung.
- Tooling-Kompatibilität ist hoch (Diff, Pipe, Filter, line-oriented Verarbeitung).
- Das Format reduziert v1-Komplexität, da Multi-Format-Parsing und semantische Divergenz vermieden werden.
- Deterministische Replay-Prüfung bleibt klar und reproduzierbar, weil jedes Event als einzelnes JSON-Objekt serialisiert ist.

### 3) Konfig-Priorität und Sicherheitsregeln für Logpfade

Die effektive Konfiguration wird strikt in folgender Reihenfolge gebildet:

1. CLI
2. ENV
3. `conf.json`
4. Defaults

**Rationale zur Priorität:**

- Explizite Laufzeit-Overrides müssen Vorrang haben.
- Betriebsnahe Eingriffe (CLI/ENV) bleiben ohne Dateimutationen möglich.
- Die Reihenfolge ist deterministisch und verhindert Quellreihenfolge-Nebenwirkungen.

**Sicherheitsregeln für Logpfade (MVP):**

- Replay-Verzeichnis muss auf schreibbaren Runtime-Speicher zeigen (Default `./log/replays`).
- Unsichere Pfadangaben werden fail-fast abgewiesen (u. a. leere Werte, Null-Bytes, relative Path-Traversal-Segmente `..`).
- Replay-Dateien sind Runtime-Artefakte und dürfen nicht in Source-/Dokumentationsbäume abgelegt werden.
- Ablage und Dateinamenkonvention müssen stabil und betriebssicher bleiben (`*.replay.ndjson`, ignoriert in VCS).

## Konsequenzen

### Positiv

- Eine konsolidierte ADR reduziert Interpretationsspielraum beim Replay-Logging-MVP.
- Format-, Namespace- und Prioritätsentscheidungen sind für Implementierung und Betrieb konsistent referenzierbar.
- Pfad-Sicherheitsregeln sind explizit und überprüfbar dokumentiert.

### Trade-offs

- v1 bleibt absichtlich auf NDJSON beschränkt.
- Strikte Pfadvalidierung kann bestehende unsaubere lokale Setups bewusst abbrechen (fail-fast).

## Geltungsbereich

Diese DD beschreibt die MVP-Entscheidungslage für Replay-Logging und ergänzt die bereits bestehenden Detail-DDs. Bei Konflikten gilt Dokumentenpräzedenz gemäß `SEC > DD > TDD > AGENTS > VISION`.
