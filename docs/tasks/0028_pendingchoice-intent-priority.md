# Codex Task 0028 — PendingChoice Priority in Intent Enumeration

**Date:** 2026-02-13  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Turn structure: CORE-01-04
* ContextTile binding: CORE-01-06-00-05

---

### Goal

When `G.engine.pendingChoice` exists, **only** ResolveChoice intents are exposed.  
No other intents appear until the choice is resolved.

---

### Inputs

* `packages/game/src/engine/resolver.ts` (pendingChoice lifecycle)
* `packages/game/src/moves.ts` (resolveChoice move)
* `enumerateLegalIntents(G, ctx, playerID)` output
* CORE-01-04 turn/stage structure
* CORE-01-06-00-05 ContextTile binding (for any effect resolution)

---

### Outputs

#### A) Intent gating

* If `G.engine.pendingChoice` exists:
  * Return only ResolveChoice intents.
  * Block all other intents.

#### B) Deterministic ordering

* ResolveChoice intents are returned in stable, deterministic order.

---

### Constraints

* No rules changes.
* No implicit effects.
* Deterministic behavior only.

---

### Invariants

* PendingChoice has priority over all other intents.
* UI and bot consume enumeration only.
* No duplicated rule logic in client.

---

### Acceptance Criteria

1. With pendingChoice set, only ResolveChoice intents are returned.
2. Without pendingChoice, normal intent enumeration applies.
3. Ordering is deterministic and stable.
4. Stage handling remains sourced from CORE-01-04.
5. ContextTile binding remains enforced (CORE-01-06-00-05).

---

### PR Checklist

* [x] PendingChoice gating implemented in enumeration
* [x] ResolveChoice intents are deterministic and stable
* [x] Tests verify gating behavior
* [x] `CHANGELOG.md` updated under Unreleased
* [x] `docs/PR_TASK_LIST.md` updated

---
