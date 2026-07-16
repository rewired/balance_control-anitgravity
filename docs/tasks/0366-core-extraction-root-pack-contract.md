# Task 0366 — CORE Extraction: Root-Pack Contract (Design Decision)

**Date:** 2026-07-16
**Owner:** Claude (Sonnet 5)
**Branch:** `task/0366-core-extraction-root-pack-contract`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

- NONE (documentation-only task; no code changed)

### compliance_notes

- N/A — no code touched. Guardrail implications of the *planned* chain (GR-002, GR-004, GR-007, GR-009, GR-012) are analyzed in DD-0366 and will be re-affirmed per-task as each stage lands.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] I applied the missing-class rule where classes are absent.
- [x] Class presence/absence documented: SEC absent, DD present (this task creates it), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (architecture/tooling task, no rule behavior change)
- EXP-01/02/03: N/A
- ARCH: ARCH-01 (engine contract — root-pack contract formalizes existing engine-authority split), ARCH-02:EXPANSION_ZONES (pack isolation model this extends)

## 2) Goal

- Freeze the `EnginePackDefinition` extension (`turn`/`endIf`/`playerView`/`enumerateIntents`) that later stages implement against.
- Freeze the topology-ownership decision, the `'core'`-special-casing deferral, the circular-import avoidance strategy, and the kernel-test decontamination policy for the whole 0366–0375 chain.
- Record why: closes out the goal of stale `docs/tasks/0098-expansions-first-class-packs.md` (FROZEN), making CORE a real, separate package like `expansion-01/02/03`.

## 3) Non-Goals

- No code changes in this task (types land in Task 0367).
- Does not resolve the `'core'` special-casing in `expansion-registry.ts` (explicitly deferred, see DD-0366 Decision 3) beyond the one narrow `move-assembly.ts` fix scheduled for a later stage.

## 4) Inputs

- `docs/hand-off/dependency-cut-map-core-extraction.md` (S02 dependency cut map, produced during planning)
- `packages/game/src/index.ts`, `packages/game/src/packs/types.ts`, `packages/game/src/engine/topology.ts`, `packages/game/src/engine/legal-intents.ts`, `packages/game/src/expansion-registry.ts`, `packages/game/src/move-assembly.ts`
- `packages/expansion-01/**` (structural template for the new package)

## 5) Outputs

### 5.1 Code

- None (design-decision task)

### 5.2 Tests

- None

### 5.3 Docs

- [x] `/docs/design-decisions/DD-0366-core-extraction-root-pack-contract.md` created
- [ ] `/docs/changelog.md` — deferred to Task 0375 (closeout), to avoid a changelog entry per intermediate stage

## 6) Constraints (Hard)

- Determinism, engine authority, no phantom moves, no implicit rules — all N/A, no code touched.

## 7) Invariants (Must remain true)

- N/A this stage — golden replay/state hash untouched.

## 8) Implementation Plan

- [x] Step 1: Write DD-0366 freezing the root-pack contract shape.
- [x] Step 2: Freeze topology-ownership decision.
- [x] Step 3: Freeze `'core'`-special-casing deferral + the one narrow fix in scope.
- [x] Step 4: Freeze circular-import avoidance strategy.
- [x] Step 5: Freeze kernel-test decontamination policy.

## 9) Acceptance Criteria

- [x] DD-0366 exists and is referenced by this task file.
- [x] No code files changed.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed (NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes (N/A — doc-only)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (not applicable — no code touched)
- [ ] `pnpm lint` — N/A (no code changed)
- [ ] `pnpm test` — N/A (no code changed)
- [x] Determinism verified — N/A (no code changed)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Wrote `DD-0366-core-extraction-root-pack-contract.md` freezing the `EnginePackDefinition` extension shape, the topology-ownership decision, the deferral of `'core'` special-casing (with one narrow exception), the circular-import avoidance strategy, and the kernel-test decontamination policy for the 0366–0375 chain.
- No source code touched — this is the guardrail-gate/design-freeze step preceding Task 0367's type changes.

## 12) Commands Run

- N/A — documentation-only task, no build/test commands applicable.

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
