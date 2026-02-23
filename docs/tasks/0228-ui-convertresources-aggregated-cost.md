# TASK 0228 — Client-Web: Display ConvertResources options as aggregated costs (never list token IDs)

**Date:** 2026-02-23  
**Status:** DRAFT  
**Owner (Execution):** Codex / Gemini  
**Author (Concept):** ChatGPT  

> **Concept-only task:** specify *what* and *why*. Implementation details are delegated.

---

## Affected Guardrails (Non‑Negotiable)

- ARCH-01: client must not compute legality or invent/dedup options that change meaning.
- ARCH-06: dock-only confirm/cancel; deterministic option ordering; no modal spam.
- UX: avoid unbounded scroll lists for core actions.

## Spec Anchors / Contract Bindings (Normative)

- ARCH-06 UI Interaction Contract (variant selection gating + draft->confirm).
- ConvertResources action steps (variant/output selection then confirm).

---

## Goal

Make ConvertResources playable by rendering a compact list of *meaningful* options. Replace any UI output that shows raw token identifiers (e.g., “VON: RES_DOM_1, RES_DOM_12 …”) with an aggregated cost summary (e.g., “Pay 2×DOM”).

## Non‑Goals

- No engine legality logic moved into the client.
- No visual redesign beyond what is necessary to avoid the unplayable list.
- No new action types introduced.

---

## Inputs

- Updated intents from TASK 0227 containing aggregated cost fields.
- ConvertWizard / ActionDock components rendering ConvertResources steps.
- Existing icon system for resorts/resources (if present).

## Outputs

- ConvertResources picker shows variant/output/penalty choices with aggregated cost summaries.
- No user-visible rendering of `RES_*` identifiers.
- If only one meaningful choice exists at a step, auto-select and proceed to draft-ready (dock confirm).

---

## Constraints

- Ordering must be stable and derived from explicit sort keys (do not rely on backend array order unless contractually stable).
- UI remains responsive even if engine returns many intents (still show grouped/virtualized list as a safety net).
- Hotseat seat switching must not break: UI state derived from game state + interaction controller.

## Invariants (Must Hold)

- Confirm/Cancel stays in dock; no auto-commit moves from list clicks.
- Displayed cost is sourced from intent fields (no recomputation/guessing).
- Player can see chosen tile + chosen output + cost summary before confirming.

---

## Plan (Concept)

1. Update the ConvertResources step renderer to consume aggregated cost fields and show them as compact text (and icons if available).
2. Remove/replace any string composition that prints `fromIds`, `RES_*`, or other internal token IDs.
3. Group options by variant; within a variant show output resort (and penalty if applicable) + cost summary in one line.
4. If a step has exactly one option, auto-select it and move to draft-ready; user still confirms in dock.
5. Add a UI regression test (unit/snapshot) asserting that ConvertResources UI does not render `RES_` anywhere.

---

## Acceptance Criteria

- [ ] ConvertResources UI never displays `RES_` token IDs; shows aggregated cost summaries instead.
- [ ] Options list is small and bounded by meaningful choices (variant/output/penalty), not token supply size.
- [ ] Single-option steps auto-select and proceed to draft-ready; confirm remains explicit in dock.
- [ ] Sorting is stable across reloads/replays for identical state.
- [ ] Regression test fails if token IDs leak into UI text.

---

## PR Checklist

- [ ] Engine remains authoritative for legality; client does not invent/deduplicate legality.
- [ ] Deterministic: identical replay ⇒ identical legal intents order + identical state hash.
- [ ] No new hidden state added to `G`; all changes are replay-safe and JSON-serializable.
- [ ] Stable ordering: explicit sort keys, no reliance on object iteration order.
- [ ] Tests added/updated to lock behavior (unit + at least one golden replay).
- [ ] Docs/TSDoc updated for any new intent fields or resolver behavior.


## Notes

- This task assumes TASK 0227 is done. If not, only apply *presentational* grouping; do not implement semantic dedup in the client.
