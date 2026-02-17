# Codex Task 0100 - Match Pack Locking + Public Surface Hash (Replay Safety)

**Date:** 2026-02-17  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

---

## Goal

Make matches replay-safe and version-safe by **locking the active pack list** at game start and recording a deterministic hash of the assembled public surface.

Target outcome:
- On game start, state includes:
  - enabled pack ids + versions + ruleset anchors
  - a stable hash over the assembled move/atom surface
- Server/bot/client can reject mismatched builds immediately.

---

## Inputs

- Pack manifests + validation (Task 0099).
- Pack-only assembly (Task 0097).

---

## Outputs

### A) Add a locked pack record into state

Add to a canonical meta location (prefer existing `G.meta` or similar):
- `enabledPacks`: array of { id, packVersion, rulesetAnchor } in canonical order
- `publicSurfaceHash`: string (e.g., hex sha256)

This is written once during setup and never changes.

### B) Define "public surface" deterministically

Public surface should include at minimum:
- sorted list of move ids that can exist in this match
- sorted list of atom/effect ids (or resolver ids) that can exist in this match
- optional: ordered pack list itself (redundant but ok)

Compute hash deterministically:
- Build a JSON object with only these fields.
- Serialize with stable key order (do not rely on JS object insertion order unless you enforce it).
- Hash with sha256.

### C) Runtime mismatch rejection points

Add a small validator callable from:
- server match creation / lobby
- bot startup (before prompting)
- client connection (optional)

Minimum: engine should throw a clear error if:
- runtime assembly surface does not match the locked hash in state
- or if a replay is loaded where the current build’s surface hash differs from the replay’s locked hash

---

## Constraints

- No nondeterminism in hashing (stable sort everywhere).
- Hash must not include environment-dependent data (paths, timestamps, random seeds).
- Do not bloat state with large payloads; store only what is needed for verification.

---

## Invariants

- A replay created with pack list X is only valid under an engine that assembles exactly the same surface X.
- The hash is stable across machines/OS.

---

## Acceptance Criteria

- Starting a match writes `enabledPacks` and `publicSurfaceHash` into state.
- A unit test proves:
  - same enabled packs -> same hash
  - different enabled packs -> different hash
- Loading a replay with mismatched surface fails fast with a clear error message.

---

## PR Checklist

- [ ] State stores locked enabled packs + surface hash
- [ ] Hash computed deterministically (sorted + stable serialization)
- [ ] Mismatch detection exists for replay load (or match start) path
- [ ] Tests added for stability and mismatch
- [ ] Meaningful commit message, e.g. `engine: lock enabled packs and add public surface hash for replay safety`
