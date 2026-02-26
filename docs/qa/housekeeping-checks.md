# Housekeeping Checks (`pnpm run check:housekeeping`)

Der Checklauf stellt dokumentarische Repository-Hygiene sicher und ergänzt die bestehenden `verify:docs`-Prüfungen.

## Was automatisch geprüft wird

1. **Root-Dokumente per Whitelist**
   - Auf Repository-Root (`./`) sind nur folgende Markdown-Dateien erlaubt:
     - `README.md`
     - `AGENTS.md`
   - Zusätzliche Root-Markdowndateien schlagen fehl, damit kanonische Dokumente nicht durch Duplikate außerhalb von `/docs` verwässert werden.

2. **Kanonischer Changelog-Pfad**
   - `docs/changelog.md` muss existieren.
   - Ein Legacy-Pfad wie `CHANGELOG.md` im Root ist verboten.

3. **Neue Task-Dateien ohne Legacy-Changelogpfade**
   - Neue `docs/tasks/*.md` (ab Task-ID 0302 sowie zusätzlich via Git-Diff gegen `main/master`, falls verfügbar) dürfen keine veralteten Pfade wie `CHANGELOG.md` verwenden.
   - Erlaubt ist ausschließlich `docs/changelog.md`.

## Grenzen (bewusst nicht automatisiert)

- Der Check bewertet **nicht** die fachliche Korrektheit von Changelog-Inhalten (nur Pfade/Struktur).
- Historische, archivierte Aufgaben werden nicht rückwirkend umgeschrieben.
- Semantische Qualitätskriterien von Task-Texten (Vollständigkeit, inhaltliche Nachvollziehbarkeit) bleiben weiterhin Teil von Review und Governance.
