# Codex Task 0041 — "Spec Audit" Command + CI Gate

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Provide a single command that answers:
"Is the engine compliant with CORE v1.1.0?"
No gut feeling, no "works on my machine".

## Inputs
- Anchor registry + tripwire (Task 0038)
- Invariants suite + golden replays (Task 0040)
- Existing CI workflow

## Outputs
1) Add scripts (names can vary, but keep intent clear):
- pnpm run audit:spec
  Runs, in this order:
  1) gen:spec-anchors (or verify generated file is up to date)
  2) spec-anchor tripwire test
  3) invariants test suite
  4) golden replay runner (hash comparison)

2) Wire audit:spec into CI:
- Add as required step in .github/workflows/ci.yml
- Ensure failure is loud and actionable (clear log output)

3) Add documentation:
- docs/architecture/SPEC-AUDIT.md
  - What is checked
  - How to interpret failures
  - How to update anchors safely (IDs never renumbered)
  - Developer workflow (local run before PR)

## Constraints
- Must run fast enough for CI (no heavy fuzzing by default).
- Must not depend on network.
- Must not introduce non-deterministic output.

## Invariants
- CI must fail on spec drift (fake/missing rule IDs, broken golden hashes, etc.).
- Engine authority remains intact.

## Acceptance
- CI runs audit:spec and fails on an injected fake rule ID reference.
- Local dev can run audit:spec with a single command.

## PR Checklist
- [ ] audit:spec script added
- [ ] CI updated
- [ ] SPEC-AUDIT.md added
- [ ] Changelog updated
- [ ] CI green
