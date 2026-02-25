# DD-0258 — Workspace Vitest Version Alignment

- **Status:** Accepted
- **Date:** 2026-02-25
- **Task:** 0258

## Context

The workspace had mixed Vitest versions:

- root + multiple packages on `vitest@^0.30.x`
- `packages/client-web` on `vitest@^0.34.6` with `@vitest/coverage-v8@^0.34.6`

This allowed pnpm to resolve incompatible runner binaries depending on invocation context, which risks unstable unit/coverage behavior in UI test commands.

## Decision

Set a single Vitest target range across workspace manifests: `vitest@^0.34.6`.

Additionally:

- Keep `@vitest/coverage-v8` aligned to `^0.34.6` in `packages/client-web`.
- Keep `packages/client-web/vite.config.ts` coverage provider as built-in `provider: 'v8'`.
- Do not configure a custom coverage provider module path.

## Consequences

- Prevents mixed major/minor Vitest binary resolution in workspace-level and package-level command execution.
- Keeps the UI coverage command compatible with the selected Vitest line.
- No gameplay/rules/engine semantics are affected (tooling-only change).
