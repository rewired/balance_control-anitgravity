# Codex Task 0139 — HAND-OFF: Refresh Context Capsule template to prevent stale state

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0139
- **Owner:** Codex
- **Area:** `docs/hand-off/*` process documentation
- **Priority:** P1
- **Risk:** Low (docs-only)
- **Branch name:** `task/0139-hand-off-protocol-refresh-context-capsule`

## 1) Guardrails (frozen)

- **Affected Guardrails:** NONE (documentation-only; no engine/client behavior changes).

## 2) Spec anchors (frozen)

- `docs/hand-off/task-packet-protocol.md` — defines the Context Capsule and workflow
- `docs/hand-off/current.md` — canonical, repo-persistent snapshot

## 3) Context (frozen)

`docs/hand-off/task-packet-protocol.md` currently contains a Context Capsule example with **historical, concrete** facts (e.g., old task IDs and outdated state bullets).
That section is intentionally copy/paste friendly, which turns it into a **footgun**: stale facts re-enter new chats.

We need to make staleness impossible by design:
- The protocol must treat the capsule as a **template**.
- The factual snapshot must be copied from `docs/hand-off/current.md` (single source of truth).

## 4) Goal (frozen)

- Remove hardcoded historical facts from the protocol’s Context Capsule section.
- Make it explicit that the capsule’s facts come from `docs/hand-off/current.md`.
- Ensure the protocol’s capsule structure still matches what we actually paste into chat.

## 5) Scope (frozen)

### 5.1 In-scope

- Update `docs/hand-off/task-packet-protocol.md`:
  - Replace the entire capsule example with placeholders (no real task IDs, no real state bullets).
  - Add a blunt instruction directly above the capsule:
    - “Do not copy facts from this file. Copy the capsule from `docs/hand-off/current.md`.”
  - Update BASE CONTRACTS line to match current baseline: `AGENTS.md + ARCH-01..05`.

### 5.2 Out-of-scope

- Any engine/package changes.
- Any spec/rule changes.

## 6) Plan (frozen)

### Steps

1) Edit `docs/hand-off/task-packet-protocol.md`:
   - Replace the stale capsule with a **template**, e.g.:
     - `LAST COMPLETED TASK: <####>`
     - `CURRENT STATE (facts):` with `- <fact>` placeholders.
     - `OPEN:` with `(None)` placeholder.
   - Add a “Copy source” note pointing to `docs/hand-off/current.md`.

2) Keep the doc short; avoid adding more prose than necessary.

3) Sanity check (cheap discipline):
   - `pnpm -r build`

### Exit criteria

- The protocol contains **no historical task IDs** or concrete “CURRENT STATE” bullets.
- The protocol explicitly identifies `docs/hand-off/current.md` as the only copy source.

## 7) Acceptance Criteria (frozen)

- `docs/hand-off/task-packet-protocol.md` capsule section uses placeholders only.
- The doc explicitly instructs copying the factual capsule from `docs/hand-off/current.md`.
- `pnpm -r build` passes.

## 8) Files likely touched (frozen)

- `docs/hand-off/task-packet-protocol.md`

## 9) Notes / hazards (frozen)

- If someone can paste stale facts again, we failed.

## 10) PR Checklist (to be completed before merge)

- [ ] Protocol updated: capsule uses placeholders only (no real task IDs, no state facts)
- [ ] Protocol explicitly references `docs/hand-off/current.md` as copy source
- [ ] Build passes (`pnpm -r build`)

## 11) Work Summary (fill after implementation)

- (fill)

## 12) Commands Run (fill after implementation)

- (fill)

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- (fill)
