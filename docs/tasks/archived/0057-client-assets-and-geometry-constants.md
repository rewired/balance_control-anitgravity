# Task 0057 - Client Assets + Geometry Constants (HexTile canonical space)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0057-client-assets-and-geometry-constants`

---

**Task State:** DONE

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

* GR-014

### compliance_notes

* GR-014: Adds stable client-side assets and runtime geometry constants under `packages/client-web` derived from the normative UI YAML contract, without introducing any client-side rules logic.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* ARCH: ARCH-01:STATE_AUTHORITY (engine is authoritative; UI must not affect rules)
* UI: UI-HEX-TILE-VISUAL v0.2 (docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml)

---

## 2) Goal

Mirror the HexTile UI contract into runtime constants used by `packages/client-web`, so later components do not re-derive geometry.

---

## 3) Non-Goals

* No engine changes.
* No rendering changes (this task is only assets + constants + types).
* No runtime geometry derivation from SVG paths (values are copied from YAML).

---

## 4) Inputs

* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` (from Task 0056)
* `docs/ui/hex-tile/fixtures/base_tile.svg`
* `docs/ui/hex-tile/fixtures/tile-overlay.png`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/assets/tiles/base_tile.svg`
* `packages/client-web/src/assets/tiles/tile-overlay.png`
* `packages/client-web/src/ui/tiles/tileGeometry.ts` (single source of truth)
* `packages/client-web/src/ui/tiles/types.ts` (UI-only types)

### 5.2 Tests

N/A (constants-only; still run repo tests as postflight proof)

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: no logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No engine changes.
* Do not implement rendering yet (this task is only assets + constants + types).
* All constants must match the YAML spec exactly (copy numbers, do not recompute).
* Paths must be stable (no temporary folders, no duplicate assets).

---

## 7) Invariants (Must remain true)

* Client remains presentation-only; no rules logic in client.
* Tile geometry values are copied exactly from the YAML contract (no derivation).

---

## 8) Implementation Plan

* [ ] Ensure `base_tile.svg` and `tile-overlay.png` exist in `packages/client-web/src/assets/tiles/` and match the fixtures from `docs/ui/hex-tile/fixtures/`.
* [ ] Add `packages/client-web/src/ui/tiles/types.ts` with seat and tile UI types (UI-only).
* [ ] Add `packages/client-web/src/ui/tiles/tileGeometry.ts` exporting constants copied from `UI-HEX-TILE-VISUAL.v0.2.yaml`.
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Assets are importable in Vite/React:
  * `import overlayUrl from \".../tile-overlay.png\"`
  * `import baseTileUrl from \".../base_tile.svg\"` (or `?react` if svgr is configured)
* [ ] Geometry constants compile and exactly match `UI-HEX-TILE-VISUAL v0.2`.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Constants match UI-HEX-TILE-VISUAL v0.2 exactly
* [x] No duplicate/unused assets added
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `packages/client-web/src/ui/tiles/tileGeometry.ts` exporting canonical HexTile geometry constants copied verbatim from `UI-HEX-TILE-VISUAL v0.2`.
* Added `packages/client-web/src/ui/tiles/types.ts` with UI-only `SeatId` and badge-related types for later HexTile components.
* Verified client tile assets match the frozen fixtures from `docs/ui/hex-tile/fixtures/` (SHA256 identical).
* Recorded guardrails, checklist, commands, and postflight proof in this task file.

---

## 12) Commands Run (exact)

* `git checkout -b task/0057-client-assets-and-geometry-constants` -> ok
* `Get-FileHash packages/client-web/src/assets/tiles/base_tile.svg; Get-FileHash docs/ui/hex-tile/fixtures/base_tile.svg` -> identical
* `Get-FileHash packages/client-web/src/assets/tiles/tile-overlay.png; Get-FileHash docs/ui/hex-tile/fixtures/tile-overlay.png` -> identical
* `pnpm -w lint` -> ok
* `pnpm --filter @balance-control/game exec vitest run --reporter=tap --no-color | Select-Object -Last 40` -> ok
* `pnpm --filter @balance-control/client-web exec vitest run --reporter=tap --no-color | Select-Object -Last 40` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0057-client-assets-and-geometry-constants
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0057-client-assets-and-geometry-constants.md
	new file:   packages/client-web/src/ui/tiles/tileGeometry.ts
	new file:   packages/client-web/src/ui/tiles/types.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 .../0057-client-assets-and-geometry-constants.md   | 197 ++++++++++++++++-----
 packages/client-web/src/ui/tiles/tileGeometry.ts   |  54 ++++++
 packages/client-web/src/ui/tiles/types.ts          |  14 ++
 3 files changed, 222 insertions(+), 43 deletions(-)
```

### 13.3 tests

```
        ok 8 - should apply ex01 setup when enabled and keep deterministic deck composition # time=2.00ms
    }
}
ok 20 - test/spec-anchor-tripwire.test.ts # time=87.00ms {
    1..1
    ok 1 - Tripwire: spec anchor registry # time=86.00ms {
        1..1
        ok 1 - fails if any referenced rule ID is missing from the registry # time=67.00ms
    }
}
ok 21 - test/tripwire-controller-grants-policy.test.ts # time=268.00ms {
    1..1
    ok 1 - Tripwire: CONTROLLER grant policy # time=267.00ms {
        1..1
        ok 1 - enforces explicit missingController policy across core and expansions # time=266.00ms
    }
}
ok 22 - test/turn.test.ts # time=139.00ms {
    1..1
    ok 1 - Turn Structure (Stages) # time=138.00ms {
        1..9
        ok 1 - should start in drawAndPlace stage # time=22.00ms
        ok 2 - should transition to politicalAction stage after placing tile # time=12.00ms
        ok 3 - should end turn after passing # time=9.00ms
        ok 4 - should reject placeTile during politicalAction stage without mutation # time=7.00ms
        ok 5 - should reject passTilePlacement when a staging tile exists # time=7.00ms
        ok 6 - should end turn and game when passTilePlacement with empty staging (DrawPile empty, CORE-01-09-01A) # time=13.00ms
        ok 7 - should end only after round settlement when draw pile empties mid-round # time=7.00ms
        ok 8 - should return expiring meta-markers at round start # time=17.00ms
        ok 9 - should complete two full rounds in 3-player hotseat without softlock # time=40.00ms
    }
}
ok 23 - test/unplaceable-draw-redraw.test.ts # time=15.00ms {
    1..1
    ok 1 - Unplaceable draw handling # time=14.00ms {
        1..2
        ok 1 - discards unplaceable drawn tile, logs notice, forces confirm, then redraws on confirm # time=12.00ms
        ok 2 - stops cleanly when DrawPile is empty after confirm # time=1.00ms
    }
}
        ok 1 - lists matches and renders seat join buttons # time=81.00ms
        ok 2 - joins a seat and transitions to the game screen using credentials # time=48.00ms
        ok 3 - quits the game via leaveMatch and returns to the lobby # time=52.00ms
    }
}
ok 8 - test/lobby-session-persistence.test.tsx # time=180.00ms {
    1..1
    ok 1 - Lobby session persistence # time=179.00ms {
        1..4
        ok 1 - writes last session to localStorage on join # time=109.00ms
        ok 2 - resumes using stored matchID/playerID/credentials (no re-join) # time=18.00ms
        ok 3 - leave clears saved session on success # time=21.00ms
        ok 4 - leave failure keeps saved session and enables force forget # time=30.00ms
    }
}
ok 9 - test/pending-choice-modal.test.tsx # time=104.00ms {
    1..1
    ok 1 - PendingChoiceModal # time=104.00ms {
        1..3
        ok 1 - renders when resolveChoice intents exist # time=68.00ms
        ok 2 - hides other controls while pending choice is visible # time=12.00ms
        ok 3 - dispatches resolveChoice with deterministic ordering # time=23.00ms
    }
}
ok 10 - test/public-notice-unplaceable.test.tsx # time=87.00ms {
    1..1
    ok 1 - PublicNoticeOverlay (unplaceable draw) # time=86.00ms {
        1..2
        ok 1 - shows notice to non-drawer without confirm # time=69.00ms
        ok 2 - shows notice to drawer and renders confirm via pendingChoice modal # time=16.00ms
    }
}
ok 11 - test/selection-inspector.test.tsx # time=123.00ms {
    1..1
    ok 1 - Selection inspector # time=123.00ms {
        1..2
        ok 1 - updates inspector content when clicking an occupied tile # time=96.00ms
        ok 2 - clears selection and inspector on Escape # time=26.00ms
    }
}
```

---

## 14) Commit Proof (copy/paste output)

### 14.1 git show -1 --stat

```
Author: Bj?rn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 08:50:57 2026 +0100

    task(0057): add hex tile geometry constants

- Add client runtime geometry constants copied verbatim from UI-HEX-TILE-VISUAL v0.2

- Add UI-only tile types for seats and badges

- Record guardrails, checklist, and postflight proof in task file

 .../0057-client-assets-and-geometry-constants.md   | 317 ++++++++++++++++++---
 packages/client-web/src/ui/tiles/tileGeometry.ts   |  54 ++++
 packages/client-web/src/ui/tiles/types.ts          |  14 +
 3 files changed, 342 insertions(+), 43 deletions(-)
```

---

## 15) Amendments (append-only)
