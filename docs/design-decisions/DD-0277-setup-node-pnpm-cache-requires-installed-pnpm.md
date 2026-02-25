# DD-0277 — setup-node pnpm cache requires installed pnpm

- **Date:** 2026-02-25
- **Status:** Accepted
- **Task:** 0277

## Context

CI jobs were configured with `actions/setup-node@v4` and `cache: pnpm` before pnpm was installed via Corepack. In this order, `setup-node` tries to resolve pnpm store metadata and fails with:

`Unable to locate executable file: pnpm`.

This prevented CI jobs from reaching install/test steps.

## Decision

Use `actions/setup-node@v4` only for Node provisioning, then install pnpm with Corepack.

1. Remove `cache: pnpm` and `cache-dependency-path` from `setup-node` steps.
2. Keep explicit Corepack activation (`corepack enable` + `corepack prepare pnpm@9.15.9 --activate`).
3. Continue running `pnpm install --frozen-lockfile` in each job after pnpm activation.

## Consequences

- CI no longer fails in setup-node due to missing pnpm binary.
- Node/pnpm bootstrap order is explicit and deterministic.
- pnpm dependency caching is disabled in this workflow until a cache mechanism that does not require preinstalled pnpm is adopted.

## Alternatives Considered

- Keep setup-node pnpm cache and preinstall pnpm globally before setup-node.
  - Rejected: increases bootstrap coupling and duplicates version management outside Corepack.
- Reintroduce `pnpm/action-setup` before setup-node.
  - Rejected: previous self-installer instability prompted migration away from that action.
