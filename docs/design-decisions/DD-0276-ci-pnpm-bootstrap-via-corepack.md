# DD-0276 — CI pnpm bootstrap via Corepack

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0276

## Context

The CI pipeline used `pnpm/action-setup@v4` in all jobs. The `ui_unit` job intermittently failed during the action's self-installer step with an exit code 1 before any repository commands executed. This made frontend gate failures non-actionable because tests were never reached.

## Decision

Adopt a single CI bootstrap pattern for pnpm:

1. Use `actions/setup-node@v4` with built-in pnpm cache (`cache: pnpm`, `cache-dependency-path: pnpm-lock.yaml`).
2. Enable Corepack and explicitly activate a pinned pnpm 9 release (`corepack prepare pnpm@9.15.9 --activate`).
3. Remove `pnpm/action-setup@v4` usage from all CI jobs.

## Consequences

- CI no longer depends on `pnpm/action-setup` self-installer behavior.
- Node/pnpm bootstrap remains explicit and reproducible across jobs.
- Cache management is simpler (single mechanism through setup-node).

## Alternatives Considered

- Keep `pnpm/action-setup` and only pin a fuller version string.
  - Rejected: still depends on the failing self-installer path.
- Rely on system pnpm without Corepack pinning.
  - Rejected: weaker determinism across runners.
