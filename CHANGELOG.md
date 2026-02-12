# Changelog

## Unreleased

- Enforced UTF-8 (no BOM), LF line endings, and added repository encoding checks via `pnpm check:encoding`.
- Replaced nondeterministic ID/RNG sources with deterministic `allocId` and `ctx.random`-driven flows.
