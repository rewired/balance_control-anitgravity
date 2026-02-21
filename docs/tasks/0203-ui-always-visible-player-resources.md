# Task 0203 — UI: Always-visible resources for ALL players (icons + counts, no colored chips)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0203-ui-always-visible-player-resources`  
**Skills:** S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: UI-only representation change. Resource values come from state; no new rules or hidden computations.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06 Checklist: `Players must be able to reason about game state; critical counters should be visible`
* ARCH-06 (YAML): `surfaces.Inspector.responsibilities.read_only_state_view`

Rule:
* If no anchor supports the change → do not implement.

---

## 2) Problem Statement

Resource display is not optimal:
* Player resources are not constantly visible for all players.
* Current “colored chips” are visually noisy and do not scale well.

Players need a compact, always-visible overview: icons + counts for each player.

---

## 3) Goal

Add an always-visible resource summary for **all players**:

* For each player/seat:
  * Resource icons (DOM/FOR/INF — plus any other baseline resources you track)
  * Numeric counts next to icons
  * Optional: Supply count (if you consider it critical)
* Layout is compact and always visible (sidebar top or a dedicated horizontal bar).
* No “colored chips” for player resources; seat color may be a subtle accent only.

---

## 4) Non-Goals

* No changes to resource rules.
* No deep redesign of the entire HUD; keep scope tight.

---

## 5) Implementation Outline

1. Identify where current resource chips are rendered (likely PlayerPanel/Sidebar).
2. Create a `PlayerResourcesRow` component:
   * receives `playerId/seatId` and resource values
   * renders icons + counts
3. Render the list for all players in a stable order (seat order).
4. Remove/replace the chip UI in the relevant area(s).

Accessibility:
* Each icon has an aria-label (i18n key).
* Counts are plain text.

---

## 6) Tests

* Add a component test (or e2e) ensuring all players render with their counts.
* Verify stable ordering (seat order).

---

## 7) Constraints

* UI remains presentation-only (GR-002).
* No new strings without i18n keys.

---

## 8) Acceptance Criteria

* [x] Resources for all players are always visible.
* [x] Display uses icons + numeric counts (no colored chips for resources).
* [x] Seat order is stable/deterministic.
* [x] Baseline checks green.

---

## 9) Work Summary

* Created `PlayerResourcesRow.tsx` to display player resources (Influence, DOM, FOR, INF, etc.) with icons and counts.
* Updated `GameLayout.tsx` to render `PlayerResourcesRow` for all players in the left sidebar.
* Removed the legacy "My Supply" zone rendering which used colored chips.
* Updated `index.css` with styles for the new resource rows.
* Added `test/player-resources.test.tsx` to verify rendering and active player highlighting.
* Verified that existing tests pass.

## 10) Commands Run

* `pnpm --filter @balance-control/client-web test test/player-resources.test.tsx` -> Passed
* `pnpm --filter @balance-control/client-web test` -> Passed (30 files, 177 tests)