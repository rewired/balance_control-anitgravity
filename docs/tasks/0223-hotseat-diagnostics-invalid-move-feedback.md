# task(0223): Hotseat diagnostics: surface invalid-move rejections + add state-consistency tripwire

- Date: 2026-02-22
- Owner: Codex
- Status: DRAFT
- Task Key: `task/0223-hotseat-diagnostics-invalid-move-feedback`

---

## 0) Guardrails Gate (MUST)

### affected_guardrails

* GR-005
* GR-006
* GR-002

*(OR write exactly: `NONE`)*

### compliance_notes (required if affected_guardrails != NONE)

- GR-005: If a “legal” intent is rejected by the engine, the UI must surface this immediately; otherwise users experience “nothing happens”.
- GR-006: When pendingChoice exists, diagnostics must not enable illegal actions; only explain.
- GR-002: Diagnostics are presentation-only and must not compute legality.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md: forbid silent auto-commit + require dock-only confirm/cancel
* docs/architecture/ARCH-01-ENGINE-CONTRACT.md: presentation-only boundary

---

## 2) Goal

- Make hotseat failures debuggable without reading console logs.
- When a move dispatch is rejected (INVALID_MOVE / no-op), the UI shows a clear, non-blocking error toast including:
  - moveType
  - short reason (best-effort)
  - current seat + ctx.currentPlayer
- Add a lightweight consistency “tripwire” in hotseat:
  - detect when UI enumerates intents from a different `{G,ctx}` than the client instance used for dispatch
  - warn in dev mode.

---

## 3) Non-Goals

- No rule changes.
- No large logging framework.
- No persistent analytics.

---

## 4) Inputs

- Current behavior:
  - `dispatchIntent` just calls `moves[intent.moveType](intent.payload)` and returns true.
  - If the engine rejects the move, the user often sees “nothing happens”.
- Hotseat complexity makes this much worse because state/moves can desync.

---

## 5) Outputs

### 5.1 Code
- Update `packages/client-web/src/ui/interaction/dispatchIntent.ts`:
  - Capture and return the move call return value (boardgame.io moves can return `INVALID_MOVE`).
  - If return indicates rejection, emit an event/callback.
- Add a minimal toast system (or reuse existing UI notice component if present):
  - `packages/client-web/src/components/PublicNoticeOverlay.tsx` can host transient error notices.
- Add a dev-only tripwire in `HotseatShell` (or interaction controller):
  - If the “render state” reference and “dispatch state” reference differ (by surface hash / turn number), show a small warning badge in the topbar.

### 5.2 Tests
- Add tests for dispatch rejection:
  - Mock a move function that returns `INVALID_MOVE` and assert a notice is shown.

---

## 6) Constraints (Hard)

- Error UI must not block board pan/zoom.
- Diagnostics must not leak hidden information (keep it moveType + generic reason).
- Must be off-by-default in production for tripwire; errors should still show.

---

## 7) Invariants (Must remain true)

- No move is silently dropped without user-visible feedback when a dispatch fails.
- Diagnostics never create new commit paths; they only observe and display.

---

## 8) Implementation Plan

1) Enhance dispatchIntent to detect rejection and propagate a structured “dispatchResult”.
2) Add a small, reusable UI notice/toast mechanism (error only).
3) Integrate into HotseatShell + ActionDock so the user sees why an action didn’t apply.
4) Add tests with mocked moves to cover rejection path.

---

## 9) Acceptance Criteria

- [ ] When a move is rejected, user sees an error notice within the dock/overlay.
- [ ] Normal legal moves still work (no performance regression).
- [ ] PendingChoice hard-gate unchanged.
- [ ] `pnpm -C packages/client-web test` passes.

---

## 15) PR Checklist (to be filled during implementation)

- [x] Preflight: read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- [x] Engine/client boundary respected (ARCH-01)
- [x] Determinism preserved (no Date.now/Math.random)
- [x] Tests updated/added as needed and pass
- [x] Task file updated with Work Summary + Commands Run
- [ ] Single meaningful commit with Postflight block

### Work Summary

- `dispatchIntent` returns a structured result and detects `INVALID_MOVE` rejections.
- Hotseat confirm/resolveChoice surfaces rejections as non-blocking toasts (moveType + seat + currentPlayer).
- Dev-only hotseat tripwire warns on render-state vs dispatch-state mismatch and surfaces a topbar badge.
- Added i18n keys (EN/DE) for rejection toasts + required-keys gate coverage.
- Added a UI test for the rejection toast path.

### Commands Run

- `pnpm -C packages/client-web test` (pass)
