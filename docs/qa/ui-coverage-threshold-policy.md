# UI Coverage Threshold Policy

**Status:** Active (Task 0253 baseline)
**Applies to:** `packages/client-web`

## Baseline Gate (enforced in Vitest)

`packages/client-web/vite.config.ts` must enforce these minimum thresholds via `test.coverage.thresholds`:

* **Branches:** `75`
* **Functions:** `80`
* **Lines:** `90`
* **Statements:** `90`

Coverage reporting is required to use:

* Provider: `v8`
* Reporters: `text`, `lcov`

## CI / Root Flow Binding

The repository root must expose and maintain these scripts:

* `test:ui:coverage` → runs `packages/client-web` coverage gate
* `test:ui:all` → runs UI coverage gate before UI E2E

## Ratcheting Policy (Verbindlich)

1. **No decreases** to any threshold in normal work.
2. Increases are done stepwise (recommended +2 to +5 points per metric per cycle).
3. Every threshold increase must be documented in:
   * `docs/changelog.md`
   * the implementing task file under `docs/tasks/`
4. If a temporary decrease is unavoidable, require:
   * a design-decision document under `docs/design-decisions/`
   * explicit expiry plan in the corresponding task file.

## Review Checklist Insert

For tasks touching UI tests, reviewers must verify:

* [ ] `pnpm -C packages/client-web test:coverage` passes.
* [ ] Thresholds in `vite.config.ts` are unchanged or increased.
* [ ] Root flow still includes `test:ui:coverage` before UI E2E in `test:ui:all`.
