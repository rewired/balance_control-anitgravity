# DD-0315 — Replay-CLI für schnelle deterministische Bug-Reproduktion

- **Status:** Accepted
- **Date:** 2026-02-26
- **Deciders:** Engine Maintainers
- **Task:** 0315

## Kontext

Replay-v1 beschreibt bereits `header`/`action`/`checkpoint`/`footer`, aber es fehlte ein operativer CLI-Flow für schnelle Bugtickets: Header-konforme Match-Initialisierung, strikt sequentielles Abspielen der Actions und fail-fast Divergenzdiagnose an der ersten Abweichung.

## Entscheidung

1. Wir führen in `packages/game` einen NDJSON-Replay-Verifier (`verifyReplayRecords`) ein, der:
   - aus dem `header` Seed + Match-Konfiguration liest,
   - den Match mit identischer Konfiguration startet,
   - `action`-Records strikt mit monotone `seq`-Prüfung ausführt,
   - bei erster Divergenz sofort mit `seq` + Diagnose abbricht.
2. Optional werden Hash-Prüfungen aktiviert über CLI-Flags:
   - `--verify-checkpoints`
   - `--verify-final-hash`
3. Wir ergänzen ein CLI-Entrypoint-Skript (`replay-verify-cli`) sowie Root-Skript `pnpm replay:verify`.

## Konsequenzen

- Bugtickets können reproduzierbar mit einer einzelnen Replay-Datei validiert werden.
- Der Ablauf bleibt absichtlich leichtgewichtig (keine Vollanalyse), aber deterministisch und fail-fast.
- Hash-Checks bleiben optional, um auch unvollständige Replays schnell zu triagieren.
