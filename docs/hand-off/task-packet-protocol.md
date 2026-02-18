# Task‑Paket‑Protokoll (damit nichts aus dem Chat verloren geht)

Ziel: Wir schneiden **kleine, ausführbare Task‑Pakete** (z. B. 2–4 Tasks), ohne dass Kontext in Chat‑Scrollback versickert.

## 0) Prinzip: Repo ist die Quelle der Wahrheit

Kein Chat ist „State“. Chat ist nur **Generator**. Der **persistente Kontext** lebt im Repo als Hand‑off.

**Einmal anlegen (neu):** `docs/hand-off/current.md`
**Nach jedem Task‑Paket aktualisieren:** denselben File (klein halten).

---

## 1) Die 3 Artefakte pro Paket

### A) `docs/hand-off/current.md` (Snapshot)

Muss enthalten:

* **Last done:** Task-ID, Datum, kurz „Outcome“
* **Current state:** 6–10 Bulletpoints (nur Fakten)
* **Decisions:** (bindend) + (offen)
* **Invariants:** Was darf *nicht* passieren (Build grün, deterministisch, etc.)
* **Next packet goal:** 1 Satz

### B) Task‑Files (klein)

* 2–4 Tasks pro Paket
* Jeder Task: **1 Ziel**, klarer Scope, keine „Mega-Refactors“
* Jeder Task: **Entry Criteria / Exit Criteria**

### C) Mini‑„Diff‑Map“ (optional, aber goldwert)

Im Hand‑off: Liste „Files likely touched“ (max. 10). Spart Sucherei.

---

## 2) Paket‑Größe (Empfehlung)

* **Paket 01 (0126–0128):** CORE Tiles JSONifizierung (nur Daten + Loader + Copy/Codegen + deterministische Sortierung fix)
* **Paket 02 (0129–0131):** Measures: JSON‑Schema + minimaler Interpreter + 1–2 Parity‑Tests
* **Paket 03 (0132–0134):** Deprecations Welle 1 (Migration ohne Löschen)
* **Paket 04 (0135–0137):** Deprecations Welle 2 (Löschen) + Script/verify‑packs Update
* **Paket 05 (0137+):** Pack‑Split (inkl. ARCH‑01 Entscheidung + Anpassung)

(Die Nummern sind Platzhalter; du bestimmst die Range pro Paket.)

---

## 3) Chat‑Workflow (ohne Kontextverlust)

### Schritt 1 — Start jeder Session

Du pastest den **Context Capsule** (unten) + das neue ZIP.

### Schritt 2 — Ich liefere nur EIN Paket

* Ein ZIP mit Task‑Files
* plus Update‑Text für `docs/hand-off/current.md`

### Schritt 3 — Nach dem Paket

Du lässt Codex ausführen, committen, ZIP wieder hier rein.

---

## 4) Context Capsule (Copy/Paste für jeden neuen Chat)

> **PROJECT:** BALANCE // CONTROL (monorepo, pnpm)
>
> **BASE CONTRACTS:** AGENTS.md + ARCH-01..04
>
> **LAST COMPLETED TASK:** 0124 (Integration-Tests in eigenem Paket; pack tests in expansion packages; game tests ohne pack imports)
>
> **CURRENT STATE (facts):**
>
> * EnginePackRegistry ist kanonisch + Duplicate checks
> * getMeasureAtomsForExpansion(...) ist der zentrale Hook; deprecated getMeasureAtoms(...) existiert noch
> * CORE Tiles sind noch hardcoded via generateCoreTiles() in packages/game/src/packs/core/index.ts
> * Measures: EXP-01..03 haben noch Switch-Logik in packages/expansion-xx/src/engine/index.ts
> * Deprecated: CoreZoneNames/CoreResources etc. werden noch in code/tests genutzt
> * Config hat noch legacy expansions flags; packs.enabledPacks existiert
> * @balance-control/game hängt noch direkt an expansion-01..03
> * scripts/verify-packs.mjs importiert derzeit Packs aus game-dist
>
> **OPEN DECISION (must be explicit):**
>
> * Pack-Split Option 1 (ARCH-01 bleibt wahr: nur Daten/UI auslagern) vs Option 2 (Regelcode in Pack-Packages; ARCH-01 anpassen)
>
> **NEXT PACKET GOAL:** <ein Satz>
>
> **CONSTRAINTS:**
>
> * keine Regeländerungen ohne Spec-Anker
> * Build + Tests grün
> * deterministische Sortierung / kanonische Reihenfolge beibehalten
>
> **DELIVERABLE:** ZIP mit 2–4 Codex-Tasks im repo-üblichen Contract-Format + Update für docs/hand-off/current.md

---

## 5) Guardrails gegen „Chat-Amnesie“

* **Alles, was eine Entscheidung ist**, wandert in „Decisions“ im Hand‑off.
* **Alles, was ein Fakt ist**, wandert in „Current state“.
* **Alles, was Arbeit ist**, wandert in Tasks.
* Der Chat bleibt frei von „wir hatten doch mal gesagt…“ – der Hand‑off ist der Beweis.
