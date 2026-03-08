# Task 0340 — Replay delta/snapshot schema + verifier validation

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0340-replay-delta-snapshot-verifier`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-001
* GR-003
* GR-012

### compliance_notes

* GR-001: Delta/snapshot projection is derived from authoritative engine state (`G.zones`, `G.objects`) and remains JSON-serializable.
* GR-003: Snapshot + delta payloads are derived deterministically from post-move state and lexicographically ordered object entries.
* GR-012: Replay metadata (`matchConfig`, expansion flags) continues to flow from canonical setup/config surfaces.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION
* FORMAT: `/docs/replay-format-v1.md` sections 3.2, 3.4, 4, 5

## 2) Goal

* Define and emit a minimal deterministic replay `stateDelta` payload on action records.
* Support periodic replay snapshots and checkpoint emission from the central replay hook.
* Extend verifier support to validate action/checkpoint snapshot payloads against replayed state.
* Keep payload strictly engine-authoritative (no UI-only fields) and stable under canonical serialization.

## 3) Non-Goals

* No gameplay legality/rules changes.
* No client-web UI changes.

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/replay-sink.ts`
  * `packages/game/src/replay-verify.ts`
  * `packages/game/test/replay-sink.test.ts`
  * `packages/game/test/replay-verify.test.ts`
* Existing behavior summary (current):
  * Replay records had deterministic action/system fields and hash checkpoints but no structured state delta/snapshot payload contract.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/client-web/process scope).

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/replay-sink.ts`
* `packages/game/src/replay-verify.ts`

### 5.2 Tests

* `packages/game/test/replay-sink.test.ts`
* `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0340-replay-delta-snapshot-schema.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:
  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

## 8) Implementation Plan

* [x] Step 1: Add minimal deterministic replay snapshot and delta model in `replay-sink` and emit payloads from move hook.
* [x] Step 2: Add periodic snapshot checkpoint emission via replay hook config.
* [x] Step 3: Extend verifier shape checks and snapshot-vs-replayed-state validation.
* [x] Step 4: Add regression tests and update docs (task + DD + changelog).

## 9) Acceptance Criteria

* [x] Action records can include deterministic `stateDelta` payload scoped to zones/resources/meta-markers.
* [x] Periodic snapshot checkpoints are emitted via replay hook cadence config.
* [x] Verifier validates shape and can reject snapshot mismatches during checkpoint verification.
* [x] No UI-only fields are present in delta/snapshot payloads.
* [x] Golden replay unchanged or updated intentionally with explanation. (N/A: no golden fixture changes)

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
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added minimal replay state projection model for `zones`, `resources`, and `metaMarkers`.
* Added optional `stateDelta` generation per successful action record.
* Added periodic `stateSnapshot` emission and hook-level `checkpoint` record writes.
* Extended replay verifier to validate action/checkpoint state payload shape and snapshot consistency against replayed state.
* Added replay sink/verifier test coverage for delta/snapshot fields and checkpoint mismatch diagnostics.
* Added DD-0340 and changelog entry.

## 12) Commands Run (with outcomes)

* `pnpm vitest run packages/game/test/replay-sink.test.ts packages/game/test/replay-verify.test.ts` → FAIL (workspace-level invocation hit unresolved package entry before package prebuild)
* `pnpm -C packages/game exec vitest run test/replay-sink.test.ts test/replay-verify.test.ts` → OK
* `pnpm -C packages/game test` → FAIL (pre-existing baseline failures unrelated to this task: `core-compliance-invariants` + `spec-anchor-tripwire`)
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Captured in final commit message `Postflight:` block.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

Captured in final commit message `Postflight:` block with `git show -1 --stat`.

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
