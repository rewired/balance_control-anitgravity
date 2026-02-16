# Task 0075 - Client-Web: Simplify start flow (mode select) and make online lobby optional

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0075-client-web-simplify-start-flow-mode-select`

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
* GR-008

### compliance_notes

* GR-002: This is a start-flow refactor only. No rules logic is moved into the client.
* GR-004: Keep UI flow simple; do not add new frameworks.
* GR-008: Online multiplayer remains supported; this task only hides complexity behind a mode select.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* AGENTS: hotseat play + network multiplayer are both supported features
* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)

---

## 2) Goal

Reduce friction by splitting the start experience into two clear modes:

1) Local hotseat (2p) - the default path for quick play
2) Online lobby - available, but not the first thing you are forced to deal with

This directly addresses the "lobby feels unnecessarily complicated" problem without deleting features.

---

## 3) Non-Goals

* No removal of online lobby capabilities (create/join/list still exist).
* No rework of server/lobby protocol.
* No auth system.

---

## 4) Inputs

Current app root flow:

* `packages/client-web/src/App.tsx` (renders LobbyScreen unless already in a match)

Lobby UI:

* `packages/client-web/src/components/LobbyScreen.tsx`

Hotseat mode from Task 0071:

* `packages/client-web/src/hotseat/HotseatShell.tsx` (expected to exist after Task 0071)

Session persistence helpers:

* `packages/client-web/src/lobby/session.ts`

---

## 5) Outputs

### 5.1 Code

A) Add a lightweight StartScreen:

* Add: `packages/client-web/src/components/StartScreen.tsx`

  - Primary CTA: "Local hotseat (2p)"
  - Secondary CTA: "Online lobby"
  - Optional: show "Resume online session" only if a stored session exists (use existing `lobby/session.ts`)

B) Refactor `App.tsx` to use a simple mode state machine:

Possible states (example, keep minimal):

* `mode = 'start' | 'hotseat' | 'onlineLobby' | 'onlineMatch'`

Rules:

* Default entry is `start`.
* StartScreen chooses `hotseat` or `onlineLobby`.
* Online lobby continues into existing online match flow.
* A "Back to start" control exists in hotseat and online lobby modes (simple link/button).

C) Keep current lobby UI available:

* Existing `LobbyScreen` should render as-is (or with minimal changes), but only when mode = onlineLobby.

### 5.2 Tests

Add one minimal UI test to assert the mode select works:

* Example: `packages/client-web/src/components/__tests__/StartScreen.smoke.test.tsx`

  - Render App root
  - Click "Local hotseat (2p)" and assert the hotseat shell mounts
  - Click "Online lobby" and assert LobbyScreen mounts

### 5.3 Docs

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (optional, user-visible: start flow simplified)
* [ ] `/docs/design-decisions/DD-XXXX-start-flow-modes.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Do not change server endpoints or socket behavior.
* Do not remove any lobby functionality; only reorganize the entry flow.
* Keep URLs stable unless a query param is already used (avoid introducing routing frameworks).

---

## 7) Invariants (Must remain true)

* Online mode still works end-to-end after choosing it.
* Hotseat mode remains serverless.
* No engine changes.

---

## 8) Implementation Plan

* [ ] Implement StartScreen component.
* [ ] Refactor App to a mode-based start flow.
* [ ] Wire hotseat entry to `HotseatShell` (Task 0071 output).
* [ ] Ensure online lobby is reachable and unchanged.
* [ ] Add smoke test(s).
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] On load, user sees StartScreen (not the lobby complexity).
* [ ] Clicking Local hotseat starts a playable hotseat UI.
* [ ] Clicking Online lobby shows the existing lobby UI and online match still works.
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] StartScreen added
* [ ] App start flow simplified (mode select)
* [ ] Online lobby still works
* [ ] Hotseat still works
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

* Subject: `task(0075): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

---

## 15) Amendments (append-only)

* None
