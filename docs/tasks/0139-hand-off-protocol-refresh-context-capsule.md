# Codex Task 0139 — HAND-OFF: Refresh Context Capsule template to prevent stale state

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0139
- **Owner:** Codex
- **Area:** `docs/hand-off/*` process documentation
- **Priority:** P2
- **Risk:** Low (docs-only)
- **Branch name:** `task/0139-hand-off-protocol-refresh-context-capsule`

## 1) Guardrails (frozen)

- **GR-010 (No Downstream Breakage):** do not change code behavior; this is documentation/process.
- **GR-014 (Operator UX):** reduce workflow footguns (copy/paste stale capsules).

## 2) Spec anchors (frozen)

- `docs/hand-off/task-packet-protocol.md` — "Repo is the Source of Truth" principle
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-010, GR-014

## 3) Context (frozen)

`docs/hand-off/task-packet-protocol.md` currently includes a Context Capsule example containing historical "CURRENT STATE" bullets.
That example is easy to copy/paste verbatim, which can re-introduce stale facts into new chats.

We want the protocol to be robust:
- The capsule should be a **template**, not a snapshot.
- The snapshot lives in `docs/hand-off/current.md` and must be the copy source.

## 4) Goal (frozen)

- Update the Task Packet Protocol so the Context Capsule is **non-stale by design**.
- Make it unambiguous that the capsule should be derived from `docs/hand-off/current.md`.

## 5) Scope (frozen)

### 5.1 In-scope

- Update `docs/hand-off/task-packet-protocol.md`:
  - Replace any hardcoded "CURRENT STATE" example bullets with placeholders.
  - Add explicit instruction: copy the factual bullets from `docs/hand-off/current.md`.
  - Keep the capsule structure (PROJECT / BASE CONTRACTS / LAST DONE / CURRENT STATE / DECISIONS / NEXT GOAL / CONSTRAINTS / DELIVERABLE).

### 5.2 Out-of-scope

- Any engine/package changes.
- Any rule/spec changes.

## 6) Plan (frozen)

### Entry criteria

- None.

### Steps

1) Edit `docs/hand-off/task-packet-protocol.md`:
   - Add a prominent note above the capsule: "Do not copy the example state; copy from current.md".
   - Turn the "CURRENT STATE" list into placeholder bullets (e.g., `* <fact>`), not real facts.
   - Optionally include a tiny snippet showing how to copy/paste (e.g., "open current.md, copy sections").

2) Ensure the protocol still reads cleanly and stays short.

3) Run minimal repo checks (cheap sanity):
   - `pnpm -r build` (should pass; docs-only change but keep standard discipline).

### Exit criteria

- No historical state bullets remain in the protocol's capsule.
- The protocol clearly points to `docs/hand-off/current.md` as the source of truth.

## 7) Acceptance Criteria (frozen)

- `docs/hand-off/task-packet-protocol.md` contains a capsule template with placeholders.
- The doc explicitly instructs copying snapshot facts from `docs/hand-off/current.md`.
- `pnpm -r build` passes.

## 8) Files likely touched (frozen)

- `docs/hand-off/task-packet-protocol.md`

## 9) Notes / hazards (frozen)

- Keep it blunt. If the protocol can be misread, it will be.

## 10) PR Checklist (to be completed before merge)

- [ ] Protocol updated: capsule uses placeholders (no stale facts)
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
