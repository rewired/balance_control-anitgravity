# Codex Task 0140 — HAND-OFF: Add `verify:handoff` tripwire to prevent stale Context Capsule

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0140
- **Owner:** Codex
- **Area:** repo scripts + hand-off docs
- **Priority:** P1
- **Risk:** Low (scripts-only; CI/UX improvement)
- **Branch name:** `task/0140-hand-off-add-verify-handoff-staleness-tripwire`

## 1) Guardrails (frozen)

- **Affected Guardrails:** NONE (does not touch engine rules/state/client behavior).

## 2) Spec anchors (frozen)

- `docs/hand-off/task-packet-protocol.md` — protocol must not embed factual snapshots
- `docs/hand-off/current.md` — single source of truth for chat capsule

## 3) Context (frozen)

Even with a cleaned-up protocol, staleness tends to creep back in:
- someone reintroduces concrete “CURRENT STATE” bullets into the protocol because it’s convenient,
- or the capsule block in `current.md` drifts away from the canonical bullet list.

We need an automated “tripwire” that fails fast in CI when those mistakes happen.

## 4) Goal (frozen)

- Add a small verification script that enforces:
  1) The protocol’s capsule section is **template-only** (placeholders; no factual state).
  2) `docs/hand-off/current.md` contains a **copy/paste capsule**.
  3) The capsule’s “CURRENT STATE (facts)” list matches the canonical “Current state (facts)” list in the same file.

## 5) Scope (frozen)

### 5.1 In-scope

- Add `scripts/verify-handoff.mjs`.
- Add root npm script `verify:handoff` that runs it.

### 5.2 Out-of-scope

- Changing any gameplay logic.
- Enforcing hand-off formatting outside these two files.

## 6) Plan (frozen)

### Steps

1) Create `scripts/verify-handoff.mjs` (node, no deps):

   **Protocol checks** (`docs/hand-off/task-packet-protocol.md`):
   - Locate the “Context Capsule” section.
   - Fail if the “LAST COMPLETED TASK” line contains a concrete task id (regex `\b\d{4}\b`).
   - Fail if the capsule’s “CURRENT STATE” bullet lines do not use placeholders (require `- <fact>` / `* <fact>` style).
   - Require the protocol to explicitly reference `docs/hand-off/current.md` as the copy source.

   **Current snapshot checks** (`docs/hand-off/current.md`):
   - Require the file to contain a “Context Capsule (copy/paste)” section.
   - Extract bullet lines under:
     - `## Current state (facts)` and
     - the capsule’s `CURRENT STATE (facts)` block.
   - Normalize and assert they are identical (same count + same text).

2) Add `verify:handoff` to root `package.json` scripts.

3) Run locally:
   - `pnpm run verify:handoff`
   - `pnpm -r build`

### Exit criteria

- `pnpm run verify:handoff` fails on stale protocol content and passes on the intended template.

## 7) Acceptance Criteria (frozen)

- `scripts/verify-handoff.mjs` exists and is executable via `pnpm run verify:handoff`.
- The script fails if:
  - the protocol contains a concrete task id inside its capsule section, or
  - the protocol’s capsule facts are not placeholders, or
  - the capsule state list in `current.md` diverges from the canonical bullet list.
- `pnpm -r build` passes.

## 8) Files likely touched (frozen)

- `scripts/verify-handoff.mjs` (new)
- `package.json`

## 9) Notes / hazards (frozen)

- Keep the parser intentionally dumb. This is a tripwire, not a markdown AST.
- Error messages must tell the maintainer exactly what to fix.

## 10) PR Checklist (to be completed before merge)

- [x] `pnpm run verify:handoff` passes
- [x] Script fails on intentionally stale capsule content (manual quick test)
- [x] Build passes (`pnpm -r build`)

## 11) Work Summary (fill after implementation)

- Created `scripts/verify-handoff.mjs` to enforce protocol integrity and capsule synchronization.
- Added `verify:handoff` script to `package.json`.
- Verified script passes on clean state.
- Verified script fails when `docs/hand-off/task-packet-protocol.md` contains concrete task IDs.
- Verified script fails when `docs/hand-off/current.md` has mismatched facts between capsule and canonical list.

## 12) Commands Run (fill after implementation)

- `pnpm run verify:handoff` (Pass)
- `pnpm -r build` (Pass)
- Manual failure tests (Pass)

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- Added `verify:handoff` tripwire to prevent Context Capsule staleness.
