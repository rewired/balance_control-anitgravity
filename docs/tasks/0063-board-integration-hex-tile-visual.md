# Task 0063 - Board integration: replace card/debug tiles with HexTileVisual

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0063-board-integration-hex-tile-visual`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT -> FROZEN -> IMPLEMENTING -> VERIFYING -> COMMIT_READY -> DONE**

Rules (non-negotiable):

* Before touching code: set **Task State = FROZEN** and complete **Sections 0-9**.
* After FROZEN: **Sections 0-9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do not rewrite earlier sections.
* During IMPLEMENTING/VERIFYING: you may only:

  * check boxes in Section 10
  * fill Sections 11-14 (Work Summary / Commands / Proof)

Iteration budget (hard stop):

* Max 2 fix cycles after the first full test run. If still failing: STOP and report blockers.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-014

### compliance_notes

* GR-002: Board tile rendering switches from `Tile` (card/debug) to `HexTileVisual` (presentation-only). No legality/cost/production logic is added in the client; all derived majority coloring uses canonical engine logic from `@balance-control/game` rather than re-implementing rules in `packages/client-web`.
* GR-014: No icon mapping changes are introduced; `HexTileVisual` consumes existing props and keeps presentation contracts stable.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-HEX-TILE-VISUAL v0.2 (`docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`)

---

## 2) Goal

Replace the current board tile rendering with the composed `HexTileVisual`.

This is UI-only. No engine changes.

---

## 3) Non-Goals

* No engine changes.
* No new client-side legality checks or move enumeration.
* No changes to board coordinate math beyond mounting/scaling the tile renderer.

---

## 4) Inputs

* `packages/client-web/src/ui/tiles/HexTileVisual.tsx`

---

## 5) Outputs

### 5.1 Code

* Update the board rendering in `packages/client-web` where tiles are currently drawn as cards/debug panels:
  * Replace old component usage with `HexTileVisual`.
  * Ensure:
    * tile wrapper allows `overflow: visible` (marker protrusion)
    * pointer events for tile selection remain on the wrapper (not markers)

Add (if missing):

* `packages/client-web/src/ui/tiles/seatColor.ts`
  * maps seat -> CSS var color, used by `seatColor(seat)`

### 5.2 Tests

N/A (presentation-only; still run repo tests as postflight proof)

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: no logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No engine changes.
* Do not add client legality checks.
* Do not change board coordinate math beyond what is required to mount the tile.

---

## 7) Invariants (Must remain true)

* Tile size is controlled by the board layout (CSS). SVG scales accordingly.
* Markers do not capture pointer events.

---

## 8) Implementation Plan

* [ ] Add `seatColor(seat)` helper and theme variables for seat colors.
* [ ] Replace `HexBoard` occupied tile renderer with `HexTileVisual` (wrapper handles click/hover; markers remain `pointer-events: none`).
* [ ] Ensure wrapper and relevant containers allow `overflow: visible` to prevent marker clipping.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Tiles appear as hex tokens, not cards.
* [ ] Majority fill updates correctly per tile.
* [ ] Hover/selected reveal works on the board.
* [ ] No clipping of protruding markers.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed + complied
* [x] Old tile renderer fully removed from board path
* [x] No clipping / overflow issues in board container
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` passes
* [x] Determinism verified (N/A: UI-only)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Replace `HexBoard` occupied tile renderer with `HexTileVisual` and keep click/hover handling on the tile wrapper.
* Add `seatColor(seat)` helper and CSS seat variables for majority fill + influence markers.
* Ensure board layers/cells allow `overflow: visible` so protruding markers don’t clip.
* Update selection-inspector tests to click the wrapper (no `.tile` card element on the board path anymore).

---

## 12) Commands Run (exact)

* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -C packages/client-web test` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status`
* `git diff --stat`

---

## 13) Postflight Proof (copy/paste output)

After implementation, paste:

### 13.1 git status

```
On branch task/0063-board-integration-hex-tile-visual
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0063-board-integration-hex-tile-visual.md
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/src/index.css
	modified:   packages/client-web/test/selection-inspector.test.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/seatColor.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 .../0063-board-integration-hex-tile-visual.md      | 204 +++++++++++++++++----
 packages/client-web/src/components/HexBoard.tsx    |  57 +++++-
 packages/client-web/src/index.css                  |  18 ++
 .../client-web/test/selection-inspector.test.tsx   |  10 +-
 4 files changed, 239 insertions(+), 50 deletions(-)
```

### 13.3 tests

```
> balance-control-monorepo@0.0.0 test D:\\__DEV\\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 10:21:10 2026 +0100

    task(0063): integrate hex tile visual on board

- Replace board tile cards with HexTileVisual renderer
- Add seatColor helper + CSS vars for seat fills
- Keep interaction on wrapper and allow overflow for protruding markers
- Update selection-inspector tests to click tile wrapper

 .../0063-board-integration-hex-tile-visual.md      | 241 ++++++++++++++++++---
 packages/client-web/src/components/HexBoard.tsx    |  57 ++++-
 packages/client-web/src/index.css                  |  18 ++
 packages/client-web/src/ui/tiles/seatColor.ts      |   5 +
 .../client-web/test/selection-inspector.test.tsx   |  10 +-
 5 files changed, 281 insertions(+), 50 deletions(-)
```

---

## 15) Amendments (append-only)
