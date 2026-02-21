# Task 0174 — PendingChoice modal-driven resolution: misclick-safe confirm + pan/zoom passthrough

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0174-ui-pendingchoice-modal-misclick-safe-confirm`

---

**Task State:** COMMIT_READY

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
* GR-006

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Modal uses only engine-provided `resolveChoice` intents; no client-side legality.
* GR-006: When pendingChoice exists (non-selectTile), modal is the only UI path to dispatch `resolveChoice`.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: `ARCH-06` §5 PENDING CHOICE (HARD GATE)
* ARCH: `ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` → `commit_policy.pending_choice.resolveChoice_policy_by_kind.other`
* ARCH: `ARCH-06-UI-INTERACTION-CHECKLIST.md` → Section 6 (PendingChoice Hard-Gate)

---

## 2) Goal

* For `pendingChoice.kind !== 'selectTile'`, resolveChoice remains **modal-driven**.
* The modal is **misclick-safe**: clicking an option selects it, but does not dispatch until explicit Confirm.
* Hard-gate must still allow **pan/zoom** even while the modal is visible.

---

## 3) Non-Goals

* No I18N work (PG-6).
* No new modal UX patterns beyond misclick-safe confirm.
* No changes to `selectTile` pendingChoice behavior (handled in Task 0175).

---

## 4) Inputs

* Contracts:
  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`
  * `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`
* Code:
  * `packages/client-web/src/components/ModalHost.tsx`
  * `packages/client-web/src/components/PendingChoiceModal.tsx`
* Tests:
  * `packages/client-web/test/pending-choice-modal.test.tsx`

Existing behavior summary (current):

* The modal renders a list of buttons; clicking an option immediately dispatches `resolveChoice` (not misclick-safe).
* The modal overlay uses a full-screen wrapper that likely blocks pointer events on the board, preventing pan/zoom.

---

## 5) Outputs

### 5.1 Code

* `ModalHost.tsx`
  * Render `PendingChoiceModal` only when `vm.hasPendingChoice === true` and `vm.pendingChoice.kind !== 'selectTile'`.
* `PendingChoiceModal.tsx`
  * Add local selection state (selected intent key/index).
  * Option click = select only.
  * Add a Confirm button:
    * disabled until an option is selected
    * on click: dispatches `onResolve(selectedIntent)` exactly once
  * Overlay must not block pan/zoom:
    * allow pointer events to pass through outside the dialog (e.g., overlay `pointer-events: none` + modal panel `pointer-events: auto`).

### 5.2 Tests

* Update `packages/client-web/test/pending-choice-modal.test.tsx`:
  * the “dispatches resolveChoice” test must now:
    * click an option → expect **no dispatch yet**
    * click Confirm → expect one dispatch with chosen payload

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (N/A — UI-only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Hard-gate: only `resolveChoice` dispatch is allowed while pendingChoice exists.
* No move construction; options are the already-enumerated intents.
* Pan/zoom must keep working.

---

## 7) Invariants (Must remain true)

* `resolveChoice` dispatches exactly one engine move.
* The modal does not introduce any new commit path.

---

## 8) Implementation Plan

* [x] Adjust `ModalHost` rendering condition to include `vm.hasPendingChoice`.
* [x] Refactor `PendingChoiceModal`:
  * [x] keep deterministic ordering of options (already handled by view model sorting)
  * [x] add selection state
  * [x] add Confirm button + disabled state
  * [x] ensure overlay background does not capture pointer events (pan/zoom passthrough)
* [x] Update `pending-choice-modal.test.tsx` accordingly.
* [x] Run: `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [x] For non-selectTile pendingChoice, clicking an option does not dispatch until Confirm.
* [x] Confirm dispatches exactly one `resolveChoice` move with the selected payload.
* [x] Pan/zoom remains operable while the modal is open.
* [x] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Updated `ModalHost.tsx` to strictly check `vm.hasPendingChoice` before rendering the modal.
* Refactored `PendingChoiceModal.tsx` to implement a selection-first, confirm-later flow.
* Added a "Confirm" button that remains disabled until an option is selected.
* Updated `PendingChoiceModal` styles to allow pointer events pass-through on the overlay (for pan/zoom) while capturing events on the modal itself.
* Updated tests to verify that option clicks do not dispatch immediately and that the confirm button works as expected.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web test pending-choice-modal.test.tsx` - Passed
* `pnpm -C packages/client-web test` - Passed (24 files, 92 tests)
* `pnpm lint` - Passed

---

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
