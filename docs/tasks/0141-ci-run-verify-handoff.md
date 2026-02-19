# Codex Task 0141 — CI: Run `verify:handoff` to block stale Hand-off capsules

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0141
- **Owner:** Codex
- **Area:** CI workflow
- **Priority:** P2
- **Risk:** Low (adds a single CI step)
- **Branch name:** `task/0141-ci-run-verify-handoff`

## 1) Guardrails (frozen)

- **Affected Guardrails:** NONE (workflow-only).

## 2) Spec anchors (frozen)

- `docs/hand-off/task-packet-protocol.md` — the protocol must not embed factual snapshots
- `scripts/verify-handoff.mjs` — enforcement mechanism (introduced by Task 0140)

## 3) Context (frozen)

Local checks are not enough; the point of the tripwire is to prevent regressions from landing.
CI should fail if hand-off docs become stale again.

## 4) Goal (frozen)

- Ensure CI runs `pnpm run verify:handoff` on every PR/push.

## 5) Scope (frozen)

### 5.1 In-scope

- Update `.github/workflows/ci.yml` to run `pnpm run verify:handoff` in the main `ci` job.

### 5.2 Out-of-scope

- Changing CI structure, caching, or job topology.

## 6) Plan (frozen)

### Entry criteria

- Task 0140 merged (script + package.json script exist).

### Steps

1) Edit `.github/workflows/ci.yml`:
   - Add a step after “Run documentation verification” (or nearby) to run:
     - `pnpm run verify:handoff`

2) Run locally (sanity):
   - `pnpm run verify:handoff`

### Exit criteria

- CI includes the new step and passes.

## 7) Acceptance Criteria (frozen)

- `.github/workflows/ci.yml` runs `pnpm run verify:handoff`.
- No other CI steps are removed or reordered in ways that change behavior.

## 8) Files likely touched (frozen)

- `.github/workflows/ci.yml`

## 9) Notes / hazards (frozen)

- Keep it near other “verification” steps so it’s discoverable.

## 10) PR Checklist (to be completed before merge)

- [ ] CI updated to run `pnpm run verify:handoff`
- [ ] CI passes

## 11) Work Summary (fill after implementation)

- (fill)

## 12) Commands Run (fill after implementation)

- (fill)

## 13) Postflight (fill after implementation)

- See commit message.

## 14) Patch Notes (fill after implementation)

- (fill)
