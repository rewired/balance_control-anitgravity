# Task 0234 — Core golden replays: expand fixture library to cover key mechanics and edge cases

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0234-core-golden-replays-expand-library`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Golden fixtures use explicit seeds and canonical pack registration so hashes are deterministic.
* GR-012: Each replay includes an explicit canonical match config / ruleset manifest and verifies it before executing moves.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated, I will STOP and write a DD (design decision) or split the task.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED (golden replay stage)
* ARCH: ARCH-01:DETERMINISM
* ARCH: ARCH-02:STATE_HASHING
* CORE: CORE-01-00-T08 (replay determinism expectations, if present in core spec)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Add a representative set of CORE-only golden replay fixtures that exercise the main action paths and tricky edge cases.
* Keep fixtures minimal and readable (short move sequences, clear `id`, and `notes`).
* Increase confidence that core rules haven’t drifted by broadening the golden replay surface area beyond the current small set.

---

## 3) Non-Goals

* No expansion fixtures (CORE-only for now).
* No changes to state hashing logic or replay runner semantics (unless required to support fixture metadata safely).
* No balance tuning.

---

## 4) Inputs

* Repo areas:

  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/integration-tests/test/golden/*.json`
  * `packages/game/src/replay/** (runner)`
  * `packages/game/test/replay-runner.test.ts`

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

* `packages/integration-tests/test/golden/*.json (add ~10–20 new fixtures)`
* `packages/integration-tests/test/golden-replay.test.ts (ensure all fixtures are discovered and validated)`

### 5.3 Docs

* [ ] `docs/architecture/SPEC-AUDIT.md (update golden fixture count + guidance for adding new ones)`

---

## 6) Constraints (Hard)

* Fixtures MUST include: `id`, `seed`, `numPlayers`, `rulesetManifest`, `moves`, and expected hashes, consistent with existing schema.
* If adding new metadata (e.g. `coversRuleIds`), it MUST be additive and the runner/tests must tolerate it without changing semantics.
* Each fixture should target one primary mechanic (e.g. ConvertResources, FormalizeInfluence, Hotspot resolve, uncontrolled production) to keep failures diagnosable.
* No fixture should rely on UI-only actions; moves must be engine-authoritative.

---

## 7) Invariants (Must remain true)

* Golden replay hashes remain stable and deterministic across runs.
* Fixture discovery order is stable (sorted by filename or `id`).

---

## 8) Implementation Plan

* [ ] Design a fixture set that covers: draw/place constraints, majority computation, convert, formalize, hotspot trigger/resolve, production (controlled/uncontrolled), and at least one tricky tie/edge case.
* [ ] Generate fixtures using canonical replay tooling (existing runner/client harness); keep move counts low.
* [ ] Add fixtures under `packages/integration-tests/test/golden/` with stable filenames and clear `id` values.
* [ ] Update `golden-replay.test.ts` to validate schema and to run fixtures in stable order; verify expected hashes.
* [ ] Run integration tests and ensure failures are actionable (fixture `id` appears in assertion output).

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] At least ~10 new CORE-only golden fixtures are added and pass deterministically.
* [ ] `pnpm -C packages/integration-tests test -- golden-replay.test.ts` is green with stable expected hashes.
* [ ] Fixture schema remains backward compatible with existing fixtures.
* [ ] Failures clearly identify the fixture `id` and hash mismatch when they occur.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash) if applicable
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 12) Commands Run (with outcomes)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
