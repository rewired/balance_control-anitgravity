# Task 0051 — Client-Web: Lobby Session Persistence (Resume/Leave + Force Forget)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0051-client-web-lobby-session-persistence`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-005

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Persistence stores lobby connection/session metadata only; it does not store or compute authoritative game state.
* GR-005: No new engine moves/intents; resume/leave are Lobby API actions only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Persist the last joined lobby session (matchID/playerID/credentials/playerName/serverUrl) in `localStorage`.
* Lobby screen shows, when a saved session exists:
  * “Resume last match” (connect to match using stored credentials)
  * “Leave” (call `leaveMatch` using stored credentials)
* If `leaveMatch` fails, show the error and offer “Force forget” (local-only cleanup).

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not implement multiple saved sessions, profiles, accounts, or server-side auth.
* Do not implement auto-resume on load (must show explicit buttons).
* Do not change server behavior or introduce custom endpoints.
* Do not persist or replay engine state.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/tasks/0050-client-web-lobby-start-screen.md` (Task 0050 outputs assumed complete)
  * `packages/client-web/src/App.tsx` (screen switching and join/leave wiring)
  * `packages/client-web/src/components/LobbyScreen.tsx` (or equivalent from Task 0050)
* Existing behavior summary (current):

  * Joining/leaving works during the session but is lost on refresh/crash because `credentials` are not persisted.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* Add a small persistence module (e.g. `packages/client-web/src/lobby/session.ts`) that:
  * reads/writes/removes a single “last session” record in `localStorage`
  * validates shape defensively (treat invalid data as absent)
* Update Lobby UI:
  * show “Resume last match” + “Leave” when session exists
  * show errors and “Force forget” when leave fails
* Ensure join flow writes session immediately after successful `joinMatch`.
* Ensure successful leave clears session.

### 5.2 Tests

* Add `packages/client-web/test/lobby-session-persistence.test.tsx` (or extend lobby tests) to assert:
  * session written on join
  * resume uses stored matchID/playerID/credentials
  * leave clears session on success
  * leave failure keeps session and enables force forget

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (Unreleased): persist lobby session + resume/leave.
* [ ] `docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A expected.
* [ ] `docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A.

---

## 6) Constraints (Hard)

* Do not store credentials anywhere except in-memory and `localStorage` (per requirement) — no logs, no analytics.
* “Resume” must be explicit user action (no auto-connect).
* Leave uses boardgame.io Lobby `leaveMatch` only.
* UI-only: persistence does not affect engine determinism/state.

---

## 7) Invariants (Must remain true)

* Client remains presentation-only; no legality computation added.
* No new engine moves or state fields are introduced.
* If storage contains invalid data, lobby behaves as if no session exists.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Add a typed “last session” helper module:
  * [ ] `readLastSession(): LastSession | null`
  * [ ] `writeLastSession(session: LastSession): void`
  * [ ] `clearLastSession(): void`
  * [ ] Validate the JSON payload shape (strings only; reject otherwise).
* [ ] Wire join flow:
  * [ ] After `joinMatch` success, write session to storage.
* [ ] Lobby UI updates:
  * [ ] If session exists, render a “Resume last match” panel.
  * [ ] Resume button starts game client using stored session (same path as normal join).
  * [ ] Leave button calls `leaveMatch` using stored session, then clears storage on success.
  * [ ] If leave fails, display error + render “Force forget” button that clears storage only.
* [ ] Add/extend RTL tests with mocked `localStorage` and mocked Lobby `fetch`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] After joining a seat, refreshing the page shows Lobby with “Resume last match” + “Leave”.
* [ ] Clicking “Resume last match” enters the game screen without re-joining (uses stored credentials).
* [ ] Clicking “Leave” leaves the match (Lobby API), clears saved session, and keeps user on Lobby.
* [ ] If “Leave” fails, session remains and “Force forget” clears local session only.
* [ ] `pnpm -C packages/client-web test` is green.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `CHANGELOG.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* N/A (not implemented yet)

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* N/A

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
N/A
```

### 13.2 git diff --stat

```
N/A
```

### 13.3 Tests

```
N/A
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
N/A
```

---

## 15) Amendments (append-only)

N/A

