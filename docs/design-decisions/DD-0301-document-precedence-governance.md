# DD-0301 — Dokument-Priorität für Governance im Arbeitsalltag

- **Datum:** 2026-02-26
- **Status:** Accepted
- **Bezug:** Task 0301

## Kontext

Im Tagesgeschäft werden Entscheidungen aus mehreren Dokumentarten abgeleitet (SEC, DD, TDD, AGENTS, VISION). Ohne explizite Rangfolge entstehen widersprüchliche Auslegungen in Tasks, Annahmen und Guardrails-Abschnitten.

## Entscheidung

Für dieses Repository gilt verbindlich:

`SEC > DD > TDD > AGENTS > VISION`

Die Rangfolge ist in `docs/governance/document-precedence.md` normativ dokumentiert und wird aus `AGENTS.md` sowie dem Task-Template verlinkt.

## Konsequenzen

- Konflikte zwischen Dokumenten werden deterministisch nach Rangfolge aufgelöst.
- Task-Artefakte müssen die Prioritätsregel im Guardrails-/Assumptions-Kontext referenzieren.
- `scripts/verify-task.mjs` prüft dies automatisiert, um Regel-Drift in neuen Tasks zu verhindern.
