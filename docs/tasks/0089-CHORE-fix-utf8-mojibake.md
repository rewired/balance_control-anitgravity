# Codex Task 0089 - CHORE: Fix UTF-8 mojibake artifacts in repo text

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0089
- **Area:** text hygiene (`packages/game`, `packages/client-web`, `docs/tasks`)
- **Recommended execution order:** anytime (safe cleanup), ideally after core refactors to reduce merge pain
- **Risk:** Low (comment/doc edits only)

## 1) Context (frozen)

There are visible mojibake / encoding artifacts in a few files (typical CP1252→UTF-8 decode issues), e.g.:

- `â€”` instead of `—`
- `â€“` instead of `–`
- `â€œ` / `â€` instead of `“` / `”`

These do not change runtime behavior, but they degrade readability and are a recurring source of “did we commit with the wrong encoding?” suspicion.

Known occurrences in this repo snapshot (verify with grep before editing):

- `docs/tasks/0051-client-web-lobby-session-persistence.md`
- `packages/game/src/moves/stages/politicalAction.ts`
- `packages/game/src/engine/atoms/hotspot.ts`
- `packages/game/src/engine/resolver/costs.ts`
- `packages/game/src/moves/stages/drawAndPlace.ts`

## 2) Goal (frozen)

- Replace mojibake sequences with their intended Unicode characters.
- Ensure the repo contains **zero** occurrences of `â€”`, `â€“`, or `â€` sequences after the change.

## 3) Non-goals (frozen)

- Do not reformat code beyond the minimum needed to fix the text.
- Do not change any identifiers, logic, or tests (comment/doc only).

## 4) Inputs (frozen)

- Run a repo-wide search (excluding `node_modules`, `dist`) for:
  - `â€”`
  - `â€“`
  - `â€`

## 5) Outputs (frozen)

### Code/Docs

- [ ] Update the affected files to replace mojibake with proper punctuation/quotes.
- [ ] Ensure edits preserve ASCII-only rule anchors where applicable; only fix the broken glyphs.

### Proof

- [ ] Provide a postflight grep output showing no remaining mojibake sequences.

## 6) Constraints (frozen)

- Keep diffs reviewable: minimal line churn.
- Do not accidentally introduce new encoding problems: files must remain valid UTF-8.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- NONE

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (general repo hygiene expectations)

## 8) Acceptance Criteria (frozen)

- [ ] `grep` (or equivalent) finds **0** matches for `â€”|â€“|â€` after the fix.
- [ ] Tests still pass (sanity run: `pnpm -r test`).

## 9) PR Checklist (frozen)

- [ ] Changes are comment/doc-only (no runtime logic edits)
- [ ] Grep proof captured in the task log
- [ ] Tests pass (`pnpm -r test`)
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- 

### Commands Run

- 

### Postflight Proof

- 
