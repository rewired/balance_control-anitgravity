# S06 — Pack Registry & Duplicate Detection Check

## Purpose
Ensure packs register deterministically and fail loudly on duplicates (moves/atoms).

## Use when
- Adding a new pack
- Changing pack assembly, registry, or exports
- Splitting packages or moving files across packages

## Inputs
- Packs list (enabled packs)
- Registry implementation

## Output
- Deterministic registration order
- Duplicate errors are stable, sorted, and tested

## Steps
1. **Registry API**
   - Single canonical registry; it owns ordering + duplicate detection.
2. **Registration**
   - Registration must be deterministic (stable sort keys, no FS order).
3. **Error determinism**
   - Duplicates must produce a deterministic list (sorted) so tests are stable.
4. **Tests**
   - Unit test:
     - registers two packs with same move/atom id → expects deterministic error text.

## Guardrails
- No hidden side-registration.
- No package should import another package just to “get its rules”.
