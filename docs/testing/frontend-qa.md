# Frontend QA Runbook (ARCH-06)

**Status:** Normative Team Standard  
**Scope:** `packages/client-web`, `e2e/client-web`  
**Primary contract:** `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md` + `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`

## 1) Pflichtreihenfolge (nicht überspringen)

Run these commands in exact order:

1. `pnpm lint`
2. `pnpm run test:ui:unit`
3. `pnpm run test:ui:coverage`
4. `pnpm run test:ui:e2e`

If one step fails, stop and treat the QA gate as failed.

## 2) Pass/Fail-Kriterien

### 2.1 Gate status

- **PASS:** all four commands exit with code `0`.
- **FAIL:** at least one command exits non-zero.
- **WARN (environment only):** only allowed if failure is caused by container/OS limits (e.g. missing Playwright system libs). Must be documented in PR artifacts.

### 2.2 Criteria by command

- `pnpm lint`
  - PASS: no ESLint errors.
  - FAIL: any lint error.
- `pnpm run test:ui:unit`
  - PASS: all `packages/client-web` unit tests green.
  - FAIL: any unit spec fails or runner exits non-zero.
- `pnpm run test:ui:coverage`
  - PASS: all unit tests pass and coverage thresholds configured in `packages/client-web/vite.config.ts` are met.
  - FAIL: test failures or threshold miss.
- `pnpm run test:ui:e2e`
  - PASS: Playwright suite green.
  - FAIL: any failed/flaky-unresolved scenario.

## 3) Zuordnung zu ARCH-06 Checklist-Punkten

| QA step | Checklist focus |
|---|---|
| `pnpm lint` | Structural hygiene for ARCH-06 boundaries; supports Checklist §7 (surface responsibilities), §8 (boundaries/determinism), §9 (i18n key discipline) by preventing accidental API misuse and malformed UI wiring. |
| `pnpm run test:ui:unit` | Contract behavior in component/controller units: Checklist §1 (No Auto-Commit), §2 (Single Commit Path), §3 (LegalIntents-only), §4 (Draft/Preview/Confirm), §5 (Guided parameter selection), §6 (PendingChoice hard-gate). |
| `pnpm run test:ui:coverage` | Quality floor for ARCH-06 verification depth across §1–§10; enforces that contract tests do not erode silently. |
| `pnpm run test:ui:e2e` | Browser-level proof of ARCH-06 interaction semantics, especially §1, §2, §4, §6, §10 under realistic UI flow. |

## 4) Required PR-Artefakte

Every PR that touches UI behavior, client interaction flows, or QA setup MUST include:

1. **Commands Run block** in the task file (`docs/tasks/<task>.md`) with exact command lines and PASS/FAIL/WARN outcomes.
2. **Postflight evidence in commit message** (per task protocol):
   - `git status -sb`
   - `git diff --stat`
   - test output summary
   - `git show -1 --stat`
3. **QA logs:** relevant terminal output snippets for lint/unit/coverage/e2e (or explicit reason for WARN).
4. **Screenshots for UI-visible changes:**
   - Required when a PR changes visible UI components or interaction visuals.
   - At least one screenshot from Playwright/browser artifact with caption and path.
   - If screenshots are not possible due environment constraints, explicitly document the limitation and attempted command.

## 5) Quick copy block for task files

```md
### Frontend QA (mandatory order)
- [ ] `pnpm lint`
- [ ] `pnpm run test:ui:unit`
- [ ] `pnpm run test:ui:coverage`
- [ ] `pnpm run test:ui:e2e`

Result: PASS / FAIL / WARN (with reason)
```
