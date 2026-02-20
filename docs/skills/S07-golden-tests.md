# S07 — Golden Tests (Deterministic Fixtures)

## Purpose
Freeze behavior with reproducible “golden” fixtures so refactors don’t silently change rules.

## Use when
- You refactor move resolution, ordering, or pack assembly
- You change rules that must stay identical (or must be explicitly version-bumped)

## Inputs
- A minimal scenario seed + move sequence
- Snapshot format (JSON)

## Output
- `*.golden.json` fixtures
- Test that compares current output vs golden

## Steps
1. **Pick tiny scenarios**
   - Smallest state that hits the rule.
2. **Capture**
   - Serialize state + key derived outputs (legal intents, hashes, etc.) deterministically.
3. **Compare**
   - Deep-equal with stable sorting.
4. **Update policy**
   - If a golden changes, either:
     - revert the behavior change, or
     - bump spec/version and update fixtures with a clear “why”.

## Guardrails
- Golden updates are never “because it changed”.
- Each update needs a spec anchor or explicit version bump note.
