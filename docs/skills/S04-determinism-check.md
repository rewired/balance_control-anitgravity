# S04 — Determinism & Canonical Order Guard

## Purpose
Prevent “works on my machine” outcomes by ensuring deterministic ordering, RNG usage,
and reproducible state hashes.

## Use when
- Shuffles, registries, sorting, canonical ordering
- Any new “list of things” exposed to clients/bots/tests
- Golden tests and replay determinism

## Inputs
- Operation that produces ordering or consumes RNG

## Output
- Canonical ordering documented + covered by tests
- RNG consumption traced and stable

## Steps
1. **Ordering**
   - Define a total-order key (string/tuple) and sort once.
   - Never rely on object iteration order as “the order”.
2. **RNG**
   - Use a single seeded RNG source; never call `Math.random`.
   - Document call order when it matters (setup order especially).
3. **State**
   - Do not persist derived caches in authoritative state.
4. **Tests**
   - Add a small unit test that fails if ordering changes unexpectedly.

## Guardrails
- If behavior differs across Node versions, it’s not deterministic enough.
- Sorting keys must be explicit and stable.
