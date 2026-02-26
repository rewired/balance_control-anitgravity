# Task 0261 — Influence move atom processing proof hardening

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `task/0261-influence-move-atom-proof`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-003
* GR-008

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * `moveInfluence` continues to route mutation through `EffectResolver.resolve`.
  * Added post-resolve verification that `influence.move` was actually executed by resolver history.
* GR-003:
  * Test assertions verify deterministic single-atom history progression for cap-relocation scenario.
  * No non-deterministic sources were introduced.
* GR-008:
  * `handleInfluenceMove` now fails explicitly when source/target zone or owned influence is missing, avoiding silent no-op transitions.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-12
* CORE: CORE-01-04-12A
* CORE: CORE-01-04-12B
* ARCH: ARCH-03:RESOLUTION_ORDER

## 2) Goal

* Make the cap-regression test explicitly prove pre/post queue + history state.
* Guarantee valid `moveInfluence` flow enqueues an `influence.move` atom and confirms resolver execution.
* Prevent silent influence-move atom no-ops by failing atom handler when movement prerequisites are missing.

## 3) Non-Goals

* No change to influence caps or legality rules.
* No UI/client behavior change.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `packages/game/src/moves/stages/politicalAction/moveInfluence.ts`
  * `packages/game/src/engine/atoms/influence.ts`
* Existing behavior summary (current):
  * Cap test checked relocation counts but not queue/history atom evidence.
  * `handleInfluenceMove` could silently do nothing when no matching influence existed.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (engine + tests only, no client-web scope)

## 5) Outputs

### 5.1 Code

* `packages/game/src/moves/stages/politicalAction/moveInfluence.ts`
* `packages/game/src/engine/atoms/influence.ts`

### 5.2 Tests

* `packages/game/test/moves.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism preserved.
* Resolver remains canonical mutation path.
* No phantom actions introduced.
* No implicit rule additions.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* Influence objects remain in exactly one zone.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: Strengthen cap regression test with explicit pre/post queue/history assertions.
* [x] Step 2: Add resolver-history confirmation in `moveInfluence` for `influence.move` processing.
* [x] Step 3: Harden `handleInfluenceMove` to move exactly one owned influence or fail explicitly.
* [x] Step 4: Run targeted game tests and full workspace tests.
* [x] Step 5: Update changelog + task artifact.

## 9) Acceptance Criteria

* [x] Cap relocation test proves exactly one `influence.move` history entry is added.
* [x] `moveInfluence` returns `INVALID_MOVE` if resolver run does not process `influence.move` atom.
* [x] `handleInfluenceMove` no longer silently no-ops on missing zones/missing owned marker.
* [x] `cd packages/game && pnpm vitest run test/moves.test.ts` passes.
* [x] `pnpm test` passes.

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added explicit pre/post assertions in the cap moveInfluence test for source/target counts, queue emptiness, and history growth.
* Added history checkpointing in `moveInfluence` and explicit confirmation that `influence.move` was processed during resolve.
* Hardened `handleInfluenceMove` so invalid atom inputs fail resolver execution instead of silently swallowing transitions.
* Updated changelog and task artifact for traceability.

## 12) Commands Run (with outcomes)

* `pnpm lint` → OK
* `pnpm -C packages/game test -- moves.test.ts` → FAIL (workspace artifacts for `@balance-control/rules` unresolved before build)
* `pnpm build` → OK
* `cd packages/game && pnpm vitest run test/moves.test.ts` → OK
* `pnpm test` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

N/A
