# Task Packet Protocol (Preventing Context Loss)

Goal: We execute **small, verifiable task packets** (e.g., 2–4 tasks) without losing context in chat scrollback.

## 0) Principle: Repo is the Source of Truth

No chat is "State". Chat is only a **Generator**. The **persistent context** lives in the repo as Hand-off.

**Create once (new):** `docs/hand-off/current.md`
**Update after each task packet:** the same file (keep it short).

---

## 1) The 3 Artifacts per Packet

### A) `docs/hand-off/current.md` (Snapshot)

Must contain:

* **Last done:** Task ID, Date, short "Outcome"
* **Current state:** 6–10 Bullet points (facts only)
* **Decisions:** (binding) + (open)
* **Invariants:** What must *not* happen (Build green, deterministic, etc.)
* **Next packet goal:** 1 sentence

### B) Task Files (Small)

* 2–4 Tasks per packet
* Each task: **1 Goal**, clear scope, no "Mega-Refactors"
* Each task: **Entry Criteria / Exit Criteria**

### C) Mini "Diff Map" (Optional, but valuable)

In Hand-off: List "Files likely touched" (max 10). Saves search time.

---

## 2) Packet Size (Recommendation)

* **Packet 01 (0126–0128):** CORE Tiles JSONification (Data + Loader + Copy/Codegen + Deterministic Sort Fix only)
* **Packet 02 (0129–0131):** Measures: JSON Schema + Minimal Interpreter + 1–2 Parity Tests
* **Packet 03 (0132–0134):** Deprecations Wave 1 (Migration without deletion)
* **Packet 04 (0135–0137):** Deprecations Wave 2 (Deletion) + Script/verify-packs Update
* **Packet 05 (0137+):** Pack Split (incl. ARCH-01 Decision + Adaptation)

(The numbers are placeholders; you determine the range per packet.)

---

## 3) Chat Workflow (No Context Loss)

### Step 1 — Start of every session

You paste the **Context Capsule** (below) + the new ZIP (if applicable).

### Step 2 — I deliver only ONE packet

* A ZIP with Task Files
* plus Update Text for `docs/hand-off/current.md`

### Step 3 — After the packet

You let Codex execute, commit, and paste the ZIP back here.

---

## 4) Context Capsule (Copy/Paste for every new chat)

> **PROJECT:** BALANCE // CONTROL (monorepo, pnpm)
>
> **BASE CONTRACTS:** AGENTS.md + ARCH-01..04
>
> **LAST COMPLETED TASK:** 0124 (Integration Tests in own package; pack tests in expansion packages; game tests without pack imports)
>
> **CURRENT STATE (facts):**
>
> * EnginePackRegistry is canonical + Duplicate checks
> * getMeasureAtomsForExpansion(...) is the central hook; deprecated getMeasureAtoms(...) still exists
> * CORE Tiles are still hardcoded via generateCoreTiles() in packages/game/src/packs/core/index.ts
> * Measures: EXP-01..03 still have Switch logic in packages/expansion-xx/src/engine/index.ts
> * Deprecated: CoreZoneNames/CoreResources etc. are still used in code/tests
> * Config still has legacy expansions flags; packs.enabledPacks exists
> * @balance-control/game still depends directly on expansion-01..03
> * scripts/verify-packs.mjs currently imports Packs from game-dist
>
> **OPEN DECISION (must be explicit):**
>
> * Pack-Split Option 1 (ARCH-01 remains true: only Data/UI outsourced) vs Option 2 (Rule code in Pack Packages; adapt ARCH-01)
>
> **NEXT PACKET GOAL:** <one sentence>
>
> **CONSTRAINTS:**
>
> * No rule changes without Spec Anchor
> * Build + Tests green
> * Maintain deterministic sorting / canonical order
>
> **DELIVERABLE:** ZIP with 2–4 Codex Tasks in repo-standard Contract Format + Update for docs/hand-off/current.md

---

## 5) Guardrails against "Chat Amnesia"

* **Everything that is a decision** goes into "Decisions" in Hand-off.
* **Everything that is a fact** goes into "Current state".
* **Everything that is work** goes into Tasks.
* The Chat remains free of "didn't we say..." – the Hand-off is the proof.
