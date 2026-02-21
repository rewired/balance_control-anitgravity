# Task 0187 — CORE: Fix DrawPile ordered-zone convention (Top = first element)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0187-core-drawpile-top-first-element`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S04 (Determinism Check), S07 (Golden Tests), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-003

### compliance_notes
* GR-003: Align runtime DrawPile behavior with the canonical ordered-zone convention; determinism preserved (seeded RNG only).

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-00-05A (Ordered Zone Conventions: DrawPile/DiscardFaceUp; **Top = first element**)
* CORE-01-04-04 (DrawAndPlaceTile draws the **top** tile)
* CORE-01-04-06 (Unplaceable drawn tile → DiscardFaceUp)
* CORE-01-04-07 (After discard due to illegality, draw again)
* VAR-01-01-07 (TileRecycling: append returned tile to **bottom** before shuffle)

---

## 2) Goal

* Make all CORE DrawPile “draw top tile” operations treat **index 0** as the top.
* Keep DiscardFaceUp semantics: discarding appends to end (bottom).
* Update tests + golden tooling that currently assume “top = last element”.

---

## 3) Non-Goals

* No changes to MeasureDrawPile semantics (EXP-01) unless explicitly required by an anchor.
* No changes to shuffle algorithm or canonical pre-shuffle ordering.
* No UI changes.

---

## 4) Inputs

* Runtime draw logic:
  * `packages/game/src/mechanics-draw.ts`
* Tests / fixtures that currently stack “top” to the end:
  * `packages/game/test/unplaceable-draw-redraw.test.ts`
  * `packages/integration-tests/test/golden-replay.test.ts` (Prelude: `stackDrawPileByType`)
  * `packages/integration-tests/scripts/update-golden.mjs` (Prelude: `stackDrawPileByType`)
* Golden fixtures:
  * `packages/integration-tests/test/golden/*.json`

---

## 5) Outputs

### 5.1 Code

* Update draw-from-DrawPile to use **shift()** (top = first element):
  * `packages/game/src/mechanics-draw.ts`

### 5.2 Tests

* Update DrawPile manipulation in tests to match top=first:
  * `packages/game/test/unplaceable-draw-redraw.test.ts`
* Update golden prelude helpers to stack top at the **front** (use `unshift` or `splice(0,0,...)`):
  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/integration-tests/scripts/update-golden.mjs`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (CORE behavior change; note spec alignment).
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Determinism: no new randomness; keep the same RNG sources and call order.
* Ordered-zone semantics must match CORE-01-00-05A exactly for DrawPile/DiscardFaceUp.
* If a move is invalid, do not “fix” it here (atomicity is handled in a separate task).

---

## 7) Invariants (Must remain true)

* Identical seed + identical move sequence → identical hash.
* Golden runner remains the canonical integration gate (fixtures may update as a consequence of spec alignment).

---

## 8) Implementation Plan

* [ ] Step 1: Change CORE DrawPile draw operation from `pop()` to `shift()` in `drawTileToStaging`.
* [ ] Step 2: Update `unplaceable-draw-redraw.test.ts` to treat `drawPile.items[0]` as the top.
* [ ] Step 3: Update `stackDrawPileByType` prelude helpers to move chosen tiles to the **front** of DrawPile.
* [ ] Step 4: Run golden regenerator:
  * `pnpm -C packages/integration-tests run update:golden -- --write`
* [ ] Step 5: Run full tests:
  * `pnpm test`

---

## 9) Acceptance Criteria

* [ ] `drawTileToStaging` draws `DrawPile.items[0]` (top=first) and remains deterministic.
* [ ] `packages/game/test/unplaceable-draw-redraw.test.ts` passes without relying on “top=last”.
* [ ] Golden fixtures updated via script (no hand-editing) and `packages/integration-tests/test/golden-replay.test.ts` passes.
* [ ] `/docs/changelog.md` includes a clear entry referencing CORE-01-00-05A.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately.
* [ ] Normative anchors cited.
* [ ] `pnpm test` passes.
* [ ] Golden replay gate passes.
* [ ] Working tree clean after postflight amend.
