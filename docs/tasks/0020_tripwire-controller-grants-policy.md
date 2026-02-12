# Codex Task 0020 — Repo-wide Tripwire: enforce explicit `missingController` on all `CONTROLLER` grants

**Date:** 2026-02-12  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

**Key anchors (ASCII only):**
- Determinism: AGENTS 0.2  
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6  
- Canonical resolver: AGENTS 3.5, 3.6  
- Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5  
- Tests + golden replays + hashing: AGENTS 5.1–5.3  

---

## Context

Task 0016 intentionally made `playerId: 'CONTROLLER'` grants strict: missing `missingController` defaults to `ERROR`.
This protects against silent rule drift, but only if we prevent regressions where new code accidentally introduces
controller-targeted grants without policy.

We need a **repo-wide tripwire** that fails PRs immediately (tests/CI), before drift reaches golden replays or runtime.

---

## Goal

Add an automated check (test) that enforces:

- Any `resource.grant` atom with `playerId: 'CONTROLLER'` must declare `missingController`.

This check must cover:
- `@bc/game` core module definitions (if any)
- EXP-01 / EXP-02 / EXP-03 module definitions
- Any future expansion packages following the same module registration pattern

---

## Inputs

- Module/registry wiring used by the game (where expansions are registered or imported)
- Atom type definitions (`packages/game/src/engine/types.ts`)
- Existing test harness under `packages/game/test/*`
- Expansion entrypoints:
  - `packages/expansion-01/src/index.ts`
  - `packages/expansion-02/src/index.ts`
  - `packages/expansion-03/src/index.ts`

---

## Outputs

### A) New tripwire test

Add:

- `packages/game/test/tripwire-controller-grants-policy.test.ts`

Implementation requirements (choose the least invasive approach):

**Preferred approach (structural, no FS scanning):**
1) Import the module definitions for core + expansions (the same objects used at runtime).
2) Traverse all effect atoms reachable from:
   - measure definitions
   - modifier definitions
   - overlay/system definitions (if represented as atoms)
3) For each atom where:
   - `kind === 'resource.grant'` and `playerId === 'CONTROLLER'`
   assert:
   - `missingController` is present and is one of `ERROR|NOISE|SKIP`

If the project already has zod schemas for atoms, you may validate via schema and then apply an additional assertion
for the `CONTROLLER` case.

**Fallback approach (only if structural traversal is impractical):**
- Perform a deterministic source scan (Node fs) over `packages/**/src/**/*.ts` and flag object literals matching
  `kind: 'resource.grant'` + `playerId: 'CONTROLLER'` without `missingController`.
- Must be deterministic and stable (fixed glob order, normalized paths).

### B) Developer ergonomics

- The failing assertion message must be actionable:
  - include package/module name
  - include a stable identifier (measure id / modifier id / overlay id), if available
  - include the expected fix (“add missingController: 'SKIP' (default) unless rule requires NOISE/ERROR”)

### C) Documentation updates

- Add `docs/tasks/0020_tripwire-controller-grants-policy.md` with this contract + checklist.
- Update `docs/PR_TASK_LIST.md` to include Task 0020.
- Update `CHANGELOG.md` under **Unreleased**:
  - “Hardening: Added repo-wide tripwire test enforcing explicit `missingController` policy on CONTROLLER grants.”

---

## Constraints

- **No new mechanics.** Only tests/tooling.
- Must preserve determinism (no time/random).
- Must not rely on network or external tooling.
- Must not introduce dependency cycles between game and expansions.
- Keep runtime code unchanged (this is a test-time guardrail).

---

## Invariants

- Task 0016 strict behavior remains in place.
- Tasks 0017–0019 can evolve, but the tripwire always enforces explicitness.
- If a rule truly intends NOISE fallback, it must be encoded explicitly (`missingController: 'NOISE'`) and justified in code comment.

---

## Acceptance Criteria

1) New tripwire test exists and fails if any `CONTROLLER` grant lacks `missingController`.  
2) Tripwire test passes on current repo after 0017–0019 are complete.  
3) Full test suite passes.  
4) Docs updated: Task file + PR task list + changelog.

---

## PR Checklist

- [x] Added tripwire test `tripwire-controller-grants-policy.test.ts`
- [x] Traversal covers core + all three expansions (01/02/03)
- [x] Failure messages are actionable (package + stable id)
- [ ] `pnpm test` (repo standard) passes
- [x] `CHANGELOG.md` updated under Unreleased
- [x] `docs/PR_TASK_LIST.md` updated
- [x] Added `docs/tasks/0020_tripwire-controller-grants-policy.md` and completed checklist after implementation
