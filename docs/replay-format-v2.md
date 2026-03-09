# Replay Format v2

Canonical order:
1. `header`
2. `manifest`
3. event records (`action`, `system.choiceOpened`, `system.hotspotResolved`, `system.roundSettlement`, `checkpoint.turnEnd`, `checkpoint.roundEnd`)
4. `footer`

`header` carries static setup metadata (`schemaVersion: "2"`, `format`, `seed`, `matchConfig`, `expansions`, `loggingMode`) and MUST NOT be duplicated on body event records.
