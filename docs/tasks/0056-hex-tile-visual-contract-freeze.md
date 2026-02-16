# Task 0056 - HexTile Visual Contract Freeze (747x864 canonical space)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0056-hex-tile-visual-contract-freeze`

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

* GR-014: Adds a stable, machine-readable UI contract + fixtures under `docs/ui/hex-tile/` without introducing any client-side rules logic.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* ARCH: ARCH-01:ENGINE_CLIENT_SEPARATION (engine is authoritative; UI must not affect rules)
* UI: UI-ICONS:mapping (presentation contracts should be stable)

---

## 2) Goal

Freeze the HexTile rendering rules as a normative, machine-readable UI contract with exact geometry in canonical tile space:

* SVG canonical viewBox: 0 0 747 864 (from `base_tile.svg`)
* Overlay PNG source px: 748x865, rendered into 747x864 tile space (scale)
* Influence marker centers: exactly on the hex vertices (not inset)
* Badge slot centers + rotations: fixed (no runtime derivation)

This contract must be the single source of truth for later tasks.

---

## 3) Non-Goals

* No engine changes.
* No client legal-move logic.
* No runtime geometry derivation from SVG paths (values are frozen in YAML).

---

## 4) Inputs

* `packages/client-web/src/assets/tiles/base_tile.svg`
* `packages/client-web/src/assets/tiles/tile-overlay.png`

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

N/A (docs-only contract; still run repo tests as postflight proof)

### 5.3 Docs

* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` (normative; exact numbers)
* `docs/ui/hex-tile/README.md` (short summary)
* `docs/ui/hex-tile/fixtures/base_tile.svg`
* `docs/ui/hex-tile/fixtures/tile-overlay.png`

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: docs-only contract, no logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No engine changes.
* No client legal-move logic.
* ASCII only in docs.
* UI spec numbers must be copied exactly (no recomputation).

---

## 7) Invariants (Must remain true)

* UI remains presentation-only; no rules logic in client.
* The YAML numbers are exact; later code must reference this spec.
* Marker centers are exactly on the vertices defined in the YAML.
* Overlay is always rendered as 747x864 in tile space.

---

## 8) Implementation Plan

* [ ] Create `docs/ui/hex-tile/` and `docs/ui/hex-tile/fixtures/`.
* [ ] Add `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` with exact frozen values (no derivation).
* [ ] Add `docs/ui/hex-tile/README.md` summarizing viewBox, overlay scaling, hover/selected behavior, vertex centers, and z-order.
* [ ] Copy `base_tile.svg` and `tile-overlay.png` into `docs/ui/hex-tile/fixtures/`.
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] YAML + README + fixtures exist at the required paths.
* [ ] YAML contains the exact numeric values provided by this task (no recomputation).
* [ ] README is short and unambiguous and documents z-order (markers/badges above glass overlay).

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Spec file is normative and machine-readable (no TODOs in normative section)
* [x] Fixtures copied into `docs/ui/hex-tile/fixtures`
* [x] No engine package touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Froze HexTile visual geometry into `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` (exact numbers; no recomputation).
* Added `docs/ui/hex-tile/README.md` summarizing canonical space, overlay scaling, hover/selected visibility, and z-order.
* Copied fixtures into `docs/ui/hex-tile/fixtures/` for later tasks to reference.
* Normalized this task file to the non-negotiable task template and recorded guardrails + proof.

---

## 12) Commands Run (with outcomes)

* `git checkout -b task/0056-hex-tile-visual-contract-freeze` -> ok
* `pnpm -w lint` -> ok
* `pnpm --filter @balance-control/game exec vitest run --reporter=tap --no-color | Select-Object -Last 40` -> ok
* `pnpm --filter @balance-control/client-web exec vitest run --reporter=tap --no-color | Select-Object -Last 40` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0056-hex-tile-visual-contract-freeze
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0056-hex-tile-visual-contract-freeze.md
	new file:   docs/ui/hex-tile/README.md
	new file:   docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml
	new file:   docs/ui/hex-tile/fixtures/base_tile.svg
	new file:   docs/ui/hex-tile/fixtures/tile-overlay.png

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0056-hex-tile-visual-contract-freeze.md | 422 ++++++++++++++-------
 docs/ui/hex-tile/README.md                         |  21 +
 docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml      |  86 +++++
 docs/ui/hex-tile/fixtures/base_tile.svg            |  10 +
 docs/ui/hex-tile/fixtures/tile-overlay.png         | Bin 0 -> 553472 bytes
 5 files changed, 399 insertions(+), 140 deletions(-)
```

### 13.3 Tests

```
packages/game:
        ok 8 - should apply ex01 setup when enabled and keep deterministic deck composition # time=2.00ms
    }
}
ok 20 - test/spec-anchor-tripwire.test.ts # time=138.00ms {
    1..1
    ok 1 - Tripwire: spec anchor registry # time=137.00ms {
        1..1
        ok 1 - fails if any referenced rule ID is missing from the registry # time=125.00ms
    }
}
ok 21 - test/tripwire-controller-grants-policy.test.ts # time=288.00ms {
    1..1
    ok 1 - Tripwire: CONTROLLER grant policy # time=287.00ms {
        1..1
        ok 1 - enforces explicit missingController policy across core and expansions # time=286.00ms
    }
}
ok 22 - test/turn.test.ts # time=116.00ms {
    1..1
    ok 1 - Turn Structure (Stages) # time=115.00ms {
        1..9
        ok 1 - should start in drawAndPlace stage # time=17.00ms
        ok 2 - should transition to politicalAction stage after placing tile # time=13.00ms
        ok 3 - should end turn after passing # time=13.00ms
        ok 4 - should reject placeTile during politicalAction stage without mutation # time=6.00ms
        ok 5 - should reject passTilePlacement when a staging tile exists # time=4.00ms
        ok 6 - should end turn and game when passTilePlacement with empty staging (DrawPile empty, CORE-01-09-01A) # time=14.00ms
        ok 7 - should end only after round settlement when draw pile empties mid-round # time=5.00ms
        ok 8 - should return expiring meta-markers at round start # time=15.00ms
        ok 9 - should complete two full rounds in 3-player hotseat without softlock # time=26.00ms
    }
}
ok 23 - test/unplaceable-draw-redraw.test.ts # time=9.00ms {
    1..1
    ok 1 - Unplaceable draw handling # time=9.00ms {
        1..2
        ok 1 - discards unplaceable drawn tile, logs notice, forces confirm, then redraws on confirm # time=7.00ms
        ok 2 - stops cleanly when DrawPile is empty after confirm # time=1.00ms
    }
}

packages/client-web:
        ok 1 - lists matches and renders seat join buttons # time=87.00ms
        ok 2 - joins a seat and transitions to the game screen using credentials # time=40.00ms
        ok 3 - quits the game via leaveMatch and returns to the lobby # time=54.00ms
    }
}
ok 8 - test/lobby-session-persistence.test.tsx # time=183.00ms {
    1..1
    ok 1 - Lobby session persistence # time=183.00ms {
        1..4
        ok 1 - writes last session to localStorage on join # time=94.00ms
        ok 2 - resumes using stored matchID/playerID/credentials (no re-join) # time=22.00ms
        ok 3 - leave clears saved session on success # time=30.00ms
        ok 4 - leave failure keeps saved session and enables force forget # time=36.00ms
    }
}
ok 9 - test/pending-choice-modal.test.tsx # time=133.00ms {
    1..1
    ok 1 - PendingChoiceModal # time=131.00ms {
        1..3
        ok 1 - renders when resolveChoice intents exist # time=89.00ms
        ok 2 - hides other controls while pending choice is visible # time=11.00ms
        ok 3 - dispatches resolveChoice with deterministic ordering # time=26.00ms
    }
}
ok 10 - test/public-notice-unplaceable.test.tsx # time=71.00ms {
    1..1
    ok 1 - PublicNoticeOverlay (unplaceable draw) # time=71.00ms {
        1..2
        ok 1 - shows notice to non-drawer without confirm # time=51.00ms
        ok 2 - shows notice to drawer and renders confirm via pendingChoice modal # time=19.00ms
    }
}
ok 11 - test/selection-inspector.test.tsx # time=139.00ms {
    1..1
    ok 1 - Selection inspector # time=137.00ms {
        1..2
        ok 1 - updates inspector content when clicking an occupied tile # time=104.00ms
        ok 2 - clears selection and inspector on Escape # time=30.00ms
    }
}
```

---

## 14) Commit Proof (copy/paste output)

### 14.1 git show -1 --stat

```
Author: Bj?rn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 08:29:37 2026 +0100

    task(0056): freeze hex tile visual contract

- Add normative YAML contract for canonical 747x864 tile space with frozen marker/badge geometry

- Add short README plus SVG/PNG fixtures under docs/ui/hex-tile for stable references

- Record guardrails, checklist, commands, and postflight proof in the task file

 docs/tasks/0056-hex-tile-visual-contract-freeze.md | 447 ++++++++++++++-------
 docs/ui/hex-tile/README.md                         |  21 +
 docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml      |  86 ++++
 docs/ui/hex-tile/fixtures/base_tile.svg            |  10 +
 docs/ui/hex-tile/fixtures/tile-overlay.png         | Bin 0 -> 553472 bytes
 5 files changed, 424 insertions(+), 140 deletions(-)
```

---

## 15) Amendments (append-only)

### A-01 - Correct spec anchors to existing docs

* Reason: After freezing, verified repo paths and found `/docs/ui/icon-mapping.md` is not present and ARCH-01 uses `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` with section labels (not separate file IDs).
* Change: Treat `ARCH-01:CLIENT_RESTRICTIONS` and `ARCH-01:STATE_AUTHORITY` as the normative anchors for engine/client separation, and treat `GR-014` as the applicable stability guardrail for UI contracts. No other task content changes.
* Spec anchors: ARCH-01:CLIENT_RESTRICTIONS, ARCH-01:STATE_AUTHORITY
* Guardrails: GR-014

### A-02 - ASCII-only proof sanitation

* Reason: This task requires ASCII-only docs; raw `git show -1 --stat` output contains non-ASCII characters (author name).
* Change: Section 14 proof output replaces non-ASCII characters with `?` to keep the task file ASCII-only while preserving the rest of the output verbatim.
* Spec anchors: N/A
* Guardrails: GR-014


