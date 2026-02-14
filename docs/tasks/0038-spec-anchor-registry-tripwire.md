# Codex Task 0038 — Spec Anchor Registry + Tripwire (ID Existence Enforcement)

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Determinism: AGENTS 0.2
- Canonical effect resolver: AGENTS 3.5
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Create a machine-checked rule ID registry derived from docs/rules/*.md and enforce that every rule ID referenced in code/tests/docs exists in canonical specs.
This prevents silent drift when wording/sections are streamlined.

## Inputs
- /docs/rules/000-core.md (canonical)
- /docs/rules/001-expansion01.md (if present)
- /docs/rules/002-expansion02.md (if present)
- /docs/rules/003-expansion03.md (if present)
- AGENTS.md (anchoring policy)

## Outputs
1) Generated anchor registry artifact (choose one location; justify in PR):
   - packages/rules/src/spec-anchors.generated.json
     OR
   - packages/shared/src/spec-anchors.generated.json

The registry must include:
- list of all rule IDs found in the canonical docs (CORE + expansions present)
- optional metadata:
  - source file
  - line number or offset (best-effort; do not break determinism)

2) Add a deterministic generator script:
- pnpm run gen:spec-anchors
- Output must be stable (no timestamps, no machine-specific paths)

3) Add a tripwire test:
- Search repository text/code for tokens matching the rule ID pattern(s)
- Fail if any referenced ID is not present in the generated registry

Patterns to support (examples):
- CORE-01-04-22
- CORE-01-04-22C
- VAR-01-xx (if used)
- ADD56-01-xx (if used)
- EXP-01-xx-yy
- EXP-02-xx-yy
- EXP-03-xx-yy

4) Document usage:
- Add short section to docs/rules/README.md describing the anchor registry and how to update it safely.

## Constraints
- No runtime dependency on Markdown parsing in production bundles (generation is dev-time).
- Regex must be strict enough to avoid false positives, but inclusive enough to catch real references.
- Do not rely on headings; only IDs.

## Invariants
- Anchors are IDs, not prose.
- Failing the tripwire is a hard error (CI must fail).

## Acceptance
- pnpm run gen:spec-anchors && pnpm -r test passes.
- Introducing a fake rule reference anywhere in repo fails CI with a clear error.

## PR Checklist
- [x] Generator implemented and deterministic
- [x] Generated registry committed (or explicitly generated in CI, but pick one and enforce)
- [x] Tripwire test added
- [x] Docs updated
- [x] CI green
