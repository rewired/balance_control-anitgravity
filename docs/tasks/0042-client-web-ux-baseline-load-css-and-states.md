# Codex Task 0042 - Client-Web UX Baseline: Load CSS + Visual States + Resource Palette

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- Client is presentation only: ARCH-01, AGENTS 1.5
- No rules drift: AGENTS 0.1, 0.5, 0.6
- UTF-8 hygiene: .editorconfig, Task 0001

---

## Goal

Fix the current "unstyled / unclear interaction" baseline so the UI becomes readable and self-explanatory:

- global CSS actually loads
- tile/token states are visible (selected / disabled / clickable)
- resource colors cover all known resource types (core + expansions), even if expansions are off

No gameplay changes. No rules logic in the client.

---

## Inputs

- `packages/client-web/src/main.tsx` (currently does not import `index.css`)
- `packages/client-web/src/index.css` (missing tile state styles; partial token palette)
- `packages/client-web/src/components/Tile.tsx`
- `packages/client-web/src/components/Token.tsx`

---

## Outputs

### A) Ensure global CSS is loaded

- In `packages/client-web/src/main.tsx`, import `./index.css` (top-level).

### B) Make tile states explicit in CSS

Update `packages/client-web/src/index.css`:

- Add styles for:
  - `.tile-selected` (clear outline/glow; must be obvious at a glance)
  - `.tile-disabled` (reduced opacity; cursor not-allowed; no hover lift)
  - `.tile-clickable` (cursor pointer; hover lift allowed)
- Remove the implicit `cursor: pointer` from `.tile` base; apply cursor only via `.tile-clickable`.

### C) Complete resource token palette

Update `packages/client-web/src/index.css`:

- Add resource classes for all known types:
  - `DOM`, `FOR`, `INF`, `ECO`, `SEC`, `CLM`
- Keep class naming consistent with `Token.tsx`:
  - `.token.resource-dom`, `.token.resource-for`, ...
- Add (or reuse) CSS variables for missing accents (for example `--accent-inf`, `--accent-sec`, `--accent-clm`).

Note: This is purely visual; it must not depend on expansion enablement.

### D) Harden Token class generation

Update `packages/client-web/src/components/Token.tsx`:

- Ensure `resort` class generation is robust (lowercase, safe for string resorts).
- Add a fallback class for unknown resorts (for example `resource-unknown`) so the token remains visible.

### E) Add focused client-web tests

Add/extend vitest tests under `packages/client-web/test`:

- Tile:
  - `selected=true` adds `tile-selected`
  - `disabled=true` adds `tile-disabled`
  - `tile-clickable` only when `onClick` is provided and `disabled=false`
- Token:
  - Resource `INF` results in class `resource-inf` (and similarly `SEC` and `CLM`)
  - Unknown resort uses `resource-unknown`

### F) Bookkeeping (required by repo guardrails)

- Add this file: `docs/tasks/0042-client-web-ux-baseline-load-css-and-states.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0042)
- Update `CHANGELOG.md` under "Unreleased":
  - Client: load global styles, tile state visuals, and full resource palette.

---

## Constraints

- No move legality logic in client. Visual-only changes.
- No time-based UI behavior for correctness (no `setTimeout` hacks).
- Keep identifiers and markdown ASCII-only (avoid encoding drift).

---

## Invariants

- Engine remains authority. UI states are derived from props/intents only.
- No changes to rules packages.

---

## Acceptance Criteria

1. `pnpm -C packages/client-web dev` shows styled UI (not unstyled default DOM).
2. Selected tiles are visually obvious; disabled tiles do not look clickable.
3. Resource tokens have distinct colors for `DOM/FOR/INF/ECO/SEC/CLM`.
4. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Import `index.css` in `client-web` `main.tsx`
- [ ] Add tile state styles (selected/disabled/clickable) + correct cursor/hover behavior
- [ ] Add token palette for `DOM/FOR/INF/ECO/SEC/CLM` + fallback `resource-unknown`
- [ ] Add/extend `client-web` tests for Tile + Token class behavior
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
