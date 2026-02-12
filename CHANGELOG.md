# Changelog

## Unreleased

- Fix: EXP-03 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).
- Fix: EXP-02 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).
- Fix: EXP-01 controller-targeted grants now explicitly SKIP when no controller (compatible with resolver hardening).
- Hardening: `CONTROLLER` grants now require explicit missing-controller behavior; no implicit reroute to Noise.
- Fix: Uncontrolled ResortTile production now yields 0 (no Noise grant).
- Fixed Grassroots conversion plumbing so ConvertResources works in real matches.
- Corrected Influence cap enforcement to apply only to marker creation, not relocation.
- Fixed draw-stage softlock when DrawPile is empty; end-of-round completion remains intact.
- Fixed encoding drift by removing non-UTF-8 artifacts and hardening guardrails.
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
