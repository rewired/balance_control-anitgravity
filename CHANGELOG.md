# Changelog

## Unreleased

- Enforced UTF-8 (no BOM), LF line endings, and added repository encoding checks via `pnpm check:encoding`.
- Replaced nondeterministic ID/RNG sources with deterministic `allocId` and `ctx.random`-driven flows.
- Fixed TypeScript build errors and package exports for server integration.
- Normalized move payload contracts and added runtime validation.
- Fixed turn stage gating and per-turn usage reset to prevent softlocks.
- Made cost resolution atomic and implemented production tie-splitting.
- Fixed core move legality (Influence placement/move, formalize costs, resource conversion).
- Added expansion gating and fixed setup shuffle order for deterministic composition.
- Made PendingChoice/Measure execution deterministic and replay-stable.
- Added golden replay + state hashing harness to prevent rule drift.
