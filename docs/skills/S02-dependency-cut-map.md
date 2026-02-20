# S02 — Dependency Cut Map

## Purpose
Produce a concrete “cut map” for extracting a subsystem (e.g., CORE) into a new package,
without accidentally dragging in half the repo.

## Use when
- “Extract CORE to its own package”
- “Make game independent of expansion-*”
- “Create packs as dedicated packages”

## Inputs
- Root package to extract (e.g., `packages/game/src/packs/core/**`)
- Intended new package name and boundaries

## Output
- `docs/hand-off/dependency-cut-map-<topic>.md` containing:
  1) Allowed imports (whitelist)
  2) Forbidden imports (blacklist)
  3) File list in-scope (to move) vs out-of-scope
  4) Replacement plan (new entrypoints, adapters)

## Steps
1. **Define boundary first (one paragraph)**
   - Example: “CORE pack = data + pack wrapper + selectors; no engine rules.”
2. **Find all inbound refs**
   - `rg -n "from\s+['\"]\.\./.*core|@balance-control/packs|core-tiles\.json" packages`
3. **Find all outbound refs**
   - For each candidate file, list its imports; flag any import crossing the boundary.
4. **Classify each file**
   - MOVE: purely core pack concern
   - STAY: engine infrastructure
   - DUPLICATE/ADAPT: needs a façade or API extraction
5. **Add a “hard stop” list**
   - The 3–5 imports you must eliminate first to make the cut safe.

## Guardrails
- If a file mixes concerns, do not move it. Split it or extract a pure helper first.
- Keep ordering deterministic: if you introduce registries, define canonical sort keys.
