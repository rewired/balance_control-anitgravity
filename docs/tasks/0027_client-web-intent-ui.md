# Codex Task 0027 — Client-Web Intent-Driven UI (No Rule Duplication)

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

Make the web client **purely intent-driven**:

* Render from `G`, `ctx`, and `enumerateLegalIntents` only.
* No UI-side legality, majority, costs, or modifier stacking.

---

### Inputs

* `packages/client-web/src/*`
* `packages/game` canonical `enumerateLegalIntents`
* Stage comes **only** from `ctx.activePlayers[playerID]` (CORE-01-04)
* ContextTile binding for any effect (CORE-01-06-00-05)

---

### Outputs

#### A) Intent-driven controls

* UI renders only intents returned by `enumerateLegalIntents`.
* No duplicated legality logic in client (zero drift).

#### B) Stage sourcing

* Stage in UI is read only from `ctx.activePlayers[playerID]`.
* UI does not infer or recompute stage.

#### C) Selection state (local-only)

* Local state may track selection/hover only.
* Any action must originate from an intent returned by enumeration.

---

### Constraints

* No rules changes.
* Client must not compute legality, costs, majority, or stacking.
* Deterministic rendering order for intent lists and targets.

---

### Invariants

* UI remains a pure view; engine is authoritative.
* Intent list is the only legal action source.
* No duplicated rule logic in client.

---

### Acceptance Criteria

1. Client renders action options only from `enumerateLegalIntents`.
2. Stage is sourced exclusively from `ctx.activePlayers[playerID]` (CORE-01-04).
3. No UI-side legality or rule re-implementation remains.
4. ContextTile binding is respected via enumeration (CORE-01-06-00-05).
5. Deterministic ordering of options in UI.

---

### PR Checklist

* [x] Client actions fully driven by `enumerateLegalIntents`
* [x] Removed any duplicated legality logic from client
* [x] Stage read only from `ctx.activePlayers[playerID]` (CORE-01-04)
* [x] ContextTile binding respected via intents (CORE-01-06-00-05)
* [x] Deterministic ordering of action lists
* [x] `CHANGELOG.md` updated under Unreleased
* [x] `docs/PR_TASK_LIST.md` updated

---
