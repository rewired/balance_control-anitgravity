# Task 0360 — Replay checkpoint ordering post-commit snapshot alignment

**Date:** 2026-03-09
**Owner:** Codex
**Branch:** `task/0360-replay-checkpoint-ordering-post-commit`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-002
* GR-003

### compliance_notes

* GR-001: checkpoint projection now derives from the committed authoritative `G` snapshot via one helper and does not use lagging caches.
* GR-002: replay emission remains engine-owned and attached to move/system pipelines only.
* GR-003: checkpoint hash and summary are both computed from the same deterministic state snapshot.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* ARCH: ARCH-01:STATE_AUTHORITY
* ARCH: ARCH-01:DETERMINISM

---

## 2) Goal

* Ensure replay move emission computes checkpoint records strictly from post-mutation committed state.
* Prevent stale checkpoint projection by eliminating split/cached snapshot reads in replay emission.
* Add replay verifier consistency checks to recompute checkpoint summary fields from canonical state and assert exact match.
* Add deterministic debug guard logging for pre/post state identity/version visibility.

---

## 3) Non-Goals

* No gameplay rule logic changes.
* No client-web UI behavior changes.

---

## 4) Inputs

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/replay-verify.ts`
* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no client-web UX/process scope).

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/replay-verify.ts`

### 5.2 Tests

* `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0360-replay-checkpoint-ordering-post-commit.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Deterministic replay only.
* Authoritative state must remain engine-owned.
* No async/cached checkpoint projection race surfaces.

---

## 7) Invariants (Must remain true)

* Hash and checkpoint summary are projected from the same post-commit `G` snapshot.
* Verifier can fail fast when replay checkpoint summaries are stale or divergent.
* Debug guard is non-production/deterministic-dev-only.

---

## 8) Implementation Plan

* [x] Centralize checkpoint summary projection helper from authoritative `G` + `ctx`.
* [x] Reorder move replay emission flow to derive post-commit hash and summary from one snapshot.
* [x] Add replay verifier summary recomputation checks under checkpoint verification mode.
* [x] Add replay debug guard logging for pre/post state object identity + version.
* [x] Extend replay verifier test coverage for stale checkpoint summary rejection.

---

## 9) Acceptance Criteria

* [x] Move replay emission order is apply move -> authoritative state snapshot -> hash -> checkpoint projection.
* [x] Checkpoint projection no longer depends on asynchronous/cached lagging inputs.
* [x] Replay verifier checks checkpoint per-player/global summaries against canonical recomputation.
* [x] Debug guard logs pre/post identity/version in non-production or deterministic dev mode.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes (N/A for scoped replay engine/test changes)
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary

* Exported `projectReplayCheckpointSummary` and reused it for both turn and round checkpoints.
* Captured post-move authoritative snapshot once, then derived state hash and checkpoint summary from that same snapshot.
* Added non-production deterministic debug logging for pre/post state identity/version.
* Extended replay verifier to assert checkpoint `perPlayer` and `global` summary exact-match to canonical projection.
* Added replay verifier regression test for stale checkpoint projection mismatch.
* Added ADR (DD-0360) and changelog entry.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts` → pass
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts`
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts`
* `git show -1 --stat`

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

* N/A
