# Task 0071 - Client-Web: Local hotseat (2p) mode with seat switch (playable end-to-end)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0071-client-web-local-hotseat-2p`

---

**Task State:** DRAFT

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
* GR-004

### compliance_notes

* GR-002: Hotseat UI must not implement new rules logic. All legality comes from `enumerateLegalIntents` and existing selectors. No duplicated legality, costs, or prohibitions in client code.
* GR-004: Use only existing, maintained runtime dependencies. Prefer boardgame.io built-ins; no bespoke networking.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* AGENTS: repo goal includes hotseat play (single device)
* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)

---

## 2) Goal

Enable a fully playable local hotseat match for **2 players** in the web client:

* start a local match without running the server
* switch the displayed seat (P0 <-> P1) via UI
* play turns end-to-end using the existing stage + legal intent system

This is the shortest path to "two people can finish a game on one screen".

---

## 3) Non-Goals

* No engine/rules changes.
* No online multiplayer changes (SocketIO path remains intact).
* No new UI polish beyond what is required to play (no redesign, no new art).

---

## 4) Inputs

Existing client entry / lobby flow:

* `packages/client-web/src/App.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`

Existing game client bindings:

* `packages/client-web/src/Board.tsx` (Boardgame.io client wrapper usage)
* `@balance-control/game` exports `BalanceControl`, `enumerateLegalIntents`

Existing UI that must continue to work:

* `packages/client-web/src/components/GameLayout.tsx`
* `packages/client-web/src/components/BoardViewport.tsx`
* `packages/client-web/src/components/ActionPanel.tsx`

---

## 5) Outputs

### 5.1 Code

A) Add a local-hotseat bootstrap that creates a local 2p match using boardgame.io local multiplayer transport.

* Add: `packages/client-web/src/hotseat/HotseatShell.tsx`
  - Holds exactly two seat clients (playerID "0" and "1") connected to the same local match
  - Renders exactly one seat at a time based on an `activeSeat` state
  - Exposes "Switch seat" UI (two buttons or a toggle), visible at all times in hotseat mode
  - Shows a small status label: currentPlayer + activeSeat (debug clarity)

B) Add a simple way to enter hotseat mode (temporary entry is OK for this task).

One of the following is acceptable (pick exactly one):

* Option 1 (route-ish): `/?mode=hotseat`
* Option 2 (button): add "Local hotseat (2p)" button to `LobbyScreen` that switches App into hotseat mode

C) Keep existing online lobby unchanged and still reachable.

### 5.2 Tests

Add at least one minimal client-web test that proves the hotseat shell renders and seat switching does not crash.

* Suggested location: `packages/client-web/src/hotseat/__tests__/HotseatShell.smoke.test.tsx`

Test must be stable (no timing flakiness).

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (only if user-visible entry is warranted; otherwise mark N/A)
* [ ] `/docs/design-decisions/DD-XXXX-hotseat-mode.md` created (N/A if implemented using boardgame.io Local transport without new rules)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Hotseat mode must not require `packages/server` running.
* No engine code changes in this task.
* No duplicate legality logic in the client:

  * Hotseat uses the same `GameLayout` and existing `enumerateLegalIntents` flow.

* Seat switching must not expose hidden information:

  * When seat = P0 is active, render the P0 playerView; when seat = P1, render the P1 playerView.

---

## 7) Invariants (Must remain true)

* Online lobby path remains functional.
* Determinism is unchanged (hotseat is presentation-only; rules still in `@balance-control/game`).
* No new cross-package source imports (client-web must not import `packages/game/src/*` directly).

---

## 8) Implementation Plan

* [ ] Implement `HotseatShell` that creates two local boardgame.io clients for the same match and toggles which one is rendered.
* [ ] Add a minimal entry path into hotseat mode (query param or button).
* [ ] Add a stable smoke test for the shell + seat switch.
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] With server OFF, user can start hotseat 2p mode in the browser and see a playable game UI.
* [ ] Seat switch toggles between P0 and P1 views without errors.
* [ ] Player turn gating is correct (only the currentPlayer seat has interactive controls).
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Hotseat mode starts without server
* [ ] Seat switch UI works and is stable
* [ ] No rules/engine changes
* [ ] No cross-package source imports added
* [ ] `pnpm -w lint` passes
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes
* [ ] No temporary files

---

## 11) Work Summary (3-7 bullets)

* TODO

---

## 12) Commands Run (exact)

* TODO

---

## 13) Proof (screenshots / logs)

* TODO

---

## 14) Commit Message

Required format:

* Subject: `task(0071): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

---

## 15) Amendments (append-only)

* None
