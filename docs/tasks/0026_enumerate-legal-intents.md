# Codex Task 0026 — Canonical enumerateLegalIntents (Rules-Exact)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* ContextTile binding: CORE-01-06-00-05
* Production order: CORE-01-06-16
* Regulation order: EXP-02-04-B
* Climate stacking: EXP-03-10
* Turn structure: CORE-01-04

---

### Goal

Create a single, canonical legality enumerator:

```
enumerateLegalIntents(G, ctx, playerID)
```

It is the **only** source of truth for legal action options (for UI, bot, and tests), and it shares helpers with move validation to prevent drift.

---

### Inputs

* `packages/game/src/moves.ts` (move validation logic and payload schemas)
* `packages/game/src/engine/*` (resolver and modifiers)
* `packages/game/src/engine/selectors.ts` (existing selector utilities)
* `packages/game/src/move-contracts.ts` (payload validation contracts)
* Rule specs: CORE-01-06-00-05, CORE-01-06-16, EXP-02-04-B, EXP-03-10, CORE-01-04

---

### Outputs

#### A) Canonical enumeration function

* Add `enumerateLegalIntents(G, ctx, playerID)` in `packages/game`.
* Pure function: no RNG, no side effects, no state mutation.
* Returns an ordered list of **legal intents** for the active player only.
* Must share core legality helpers with move validation to avoid double-implementations.

#### B) Deterministic ordering

* Stable sorting for all intents and targets (coord keys, tile ids, player ids).
* No reliance on object key iteration order.

#### C) Rule-anchored legality

Legality and ordering must respect:

* ContextTile binding (CORE-01-06-00-05)
* Production order (CORE-01-06-16)
* Regulation order (EXP-02-04-B)
* Climate stacking (EXP-03-10)
* Turn structure & stages (CORE-01-04)

---

### Constraints

* No rules changes or new mechanics.
* No implicit effects.
* Deterministic and replayable output.
* Must not bypass move validation; must **reuse** legality helpers.

---

### Invariants

* UI and bot will consume enumeration output only.
* Enumerations must match move validation exactly (no drift).
* Engine remains the single source of truth.

---

### Acceptance Criteria

1. `enumerateLegalIntents` exists and is pure/deterministic.
2. Output legality matches move validation for all stages (CORE-01-04).
3. ContextTile binding is enforced in enumeration (CORE-01-06-00-05).
4. Production / Regulation / Climate ordering constraints are respected where applicable:
   * CORE-01-06-16
   * EXP-02-04-B
   * EXP-03-10
5. Bot/LLM can act using **only** enumerated intents.
6. Tests exist proving deterministic ordering and no drift against move validation.

---

### PR Checklist

* [ ] Added `enumerateLegalIntents(G, ctx, playerID)` in `packages/game`
* [ ] Shared legality helpers with move validation (no duplicated logic)
* [ ] Deterministic sorting of intent lists and targets
* [ ] ContextTile binding enforced (CORE-01-06-00-05)
* [ ] Production/regulation/climate ordering respected (CORE-01-06-16, EXP-02-04-B, EXP-03-10)
* [ ] Tests added for determinism and validation parity
* [ ] `CHANGELOG.md` updated under Unreleased
* [ ] `docs/PR_TASK_LIST.md` updated

---
