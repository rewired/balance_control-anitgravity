# Task 0271 — Ensure meta-marker relocation removes prior zone duplicates globally

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-009

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: The relocation logic remains deterministic by using a stable full-zone sweep + single destination push.
* GR-009: `placeMetaMarkerOnTile` now enforces single-zone membership by removing marker IDs from all zones before placement.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-00-01
* CORE: CORE-01-02-17C
* ARCH: ARCH-01:DETERMINISM
* ARCH: ARCH-02:ZONE_MODEL

## 2) Goal

* Make `placeMetaMarkerOnTile(...)` remove `marker.id` from every zone before placing it on the destination tile.
* Extend the existing ReturnPenalty test to explicitly prove `meta_p1` exists in exactly one zone after `moveInfluence`.

## 3) Non-Goals

* No change to move legality rules.
* No change to non-marker object movement.
* No UI or network behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/moves/shared.ts`
  * `packages/game/test/moves.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine logic + unit test scope only)

## 5) Outputs

### 5.1 Code

* `packages/game/src/moves/shared.ts`

### 5.2 Tests

* `packages/game/test/moves.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required by local documentation policy)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Keep marker mode assignment (`marker.mode = mode`) intact.
* Place marker once in destination zone if it exists.
* Preserve deterministic mutation order.

## 7) Invariants (Must remain true)

* Meta-marker remains in exactly one zone after relocation.
* MoveInfluence ReturnPenalty path keeps expected marker mode.
* No duplicate marker IDs across zones.

## 8) Implementation Plan

* [x] Step 1: Replace single-zone removal with `Object.values(G.zones)` full sweep filtering in `placeMetaMarkerOnTile`.
* [x] Step 2: Keep destination-zone push and mode assignment semantics.
* [x] Step 3: Add explicit meta-marker exclusivity assertion to the destination-start ReturnPenalty test.
* [x] Step 4: Run targeted moves test and lint.
* [x] Step 5: Update changelog and task artifact.

## 9) Acceptance Criteria

* [x] `placeMetaMarkerOnTile` removes marker ID from all `G.zones[*].items` before destination placement.
* [x] Marker is pushed only once to destination zone when destination exists.
* [x] Existing test `moveInfluence should set ReturnPenalty mode when meta-marker starts on destination` asserts marker exclusivity.
* [x] Targeted moves test passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [x] Determinism verified (golden replay/state hash) (scope note: deterministic mutation invariant covered by zone exclusivity assertion)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Changed `placeMetaMarkerOnTile` to filter `marker.id` out of every zone before placement.
* Preserved destination placement and mode assignment behavior.
* Added a zone-count assertion proving `meta_p1` appears in exactly one zone after ReturnPenalty relocation from destination.
* Verified targeted move test and lint pass.
* Updated changelog and this task artifact.

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "moveInfluence should set ReturnPenalty mode when meta-marker starts on destination"` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
