# Task 0193 — Docs: Update hand-off snapshot to current task line and next packet goal

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0193-docs-update-hand-off-current`
**Skills:** S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* NONE

### guardrail_gate
* [x] I read the guardrails file before implementation.

---

## 1) Primary Spec Anchors (MUST)

* AGENTS.md: Hand-off Protocol ("/docs/hand-off/current.md must be updated after every task packet")
* `/docs/hand-off/task-packet-protocol.md`

---

## 2) Goal

* Bring `/docs/hand-off/current.md` in sync with the repo’s actual task line (>= 0185).
* Update “Next Packet Goal” to the new immediate objective:
  * CORE rules conformance patchset (0187–0192): DrawPile top semantics, starting player RNG, atomic costs, influence supply legality, hotspot resolved-mark, convert intent parity.

---

## 3) Non-Goals

* No rule text changes.
* No code changes.

---

## 4) Inputs

* `/docs/hand-off/current.md`
* `/docs/tasks/0181..0185*.md` (completed work)
* `/docs/tasks/0187..0192*.md` (this packet)

---

## 5) Outputs

### 5.1 Docs

* Update `/docs/hand-off/current.md`:
  * `LAST COMPLETED TASK` → 0185 (or the highest actually completed at merge time)
  * `Current state (facts)` → include the UI interaction contract + i18n status (PG-6)
  * `NEXT PACKET GOAL` → CORE conformance patchset (0187–0192)
  * `Mini diff map` → list the likely-touched areas for 0187–0192

---

## 6) Constraints (Hard)

* Keep the Context Capsule copy/paste block valid and up-to-date.
* Do not claim tasks as completed unless merged.

---

## 7) Implementation Plan

* [x] Step 1: Update the header capsule fields and the duplicated sections below it.
* [x] Step 2: Ensure “Current state (facts)” matches the repo reality (no wishful thinking).
* [x] Step 3: Ensure Next Packet Goal matches 0187–0192.

---

## 8) Acceptance Criteria

* [x] `/docs/hand-off/current.md` no longer says “LAST COMPLETED TASK: 0141”.
* [x] The “Next Packet Goal” is actionable and matches the next tasks.

---

## 9) PR Checklist

* [x] Docs only; no code changes.
* [x] Working tree clean.
