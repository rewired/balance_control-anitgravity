# Task 0234 — Core golden replays: add representative fixtures for CORE mechanics and link them as obligations evidence

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0234-core-golden-replays-evidence`

---

**Task State:** DONE

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

* GR-003: Fixtures use explicit seeds and canonical pack registration so hashes are deterministic.
* GR-012: Each replay fixture must declare/assume a canonical match config; tests must fail loudly if config differs.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03 (Setup determinism)
* CORE: CORE-01-04 (Turn Structure)
* CORE: CORE-01-05 (Control)
* CORE: CORE-01-07 (Round Settlement)
* ARCH: ARCH-01:DETERMINISM
* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Add a small set of **representative** golden replay fixtures that cover core mechanics and edge cases.
* Use these fixtures as **evidence** for normative CORE obligations (linked in `CORE-01-OBLIGATIONS.json`).

---

## 3) Non-Goals

* No AI/bot simulation.
* No expansion fixtures.
* No large fixture library; keep it curated.

---

## 4) Inputs

* Repo areas:

  * `packages/integration-tests/test/golden-replay.test.ts`
  * `packages/integration-tests/test/golden/*.json`
  * `packages/integration-tests/scripts/update-golden.mjs`
  * `docs/architecture/CORE-01-OBLIGATIONS.json`

* Existing behavior summary (current):

  * A few goldens exist (core 3p 2 rounds, production uncontrolled, convert fungible). Coverage is not yet explicitly mapped to CORE obligations.

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

* `packages/integration-tests/test/golden/*.json` added/updated

### 5.3 Docs

* `docs/architecture/CORE-01-OBLIGATIONS.json` updated (add `golden:` evidence entries)

---

## 6) Constraints (Hard)

* Every new fixture must:

  * have a stable `id`
  * include an explicit `seed`
  * use **core-only** packs
  * assert expected final hash + public surface hash

* Avoid brittle “pixel” expectations; goldens should validate state hashes only.
* Keep fixture count low: prefer 5–10 strong fixtures over 30 weak ones.

---

## 7) Invariants (Must remain true)

* Existing golden fixtures remain valid unless an intentional, reviewed engine change occurs (not expected in this task).
* `pnpm -C packages/integration-tests test -- golden-replay.test.ts` remains deterministic.

---

## 8) Implementation Plan

* [x] Add curated fixtures to cover the following CORE clusters (use prelude helpers as needed):

  * DrawAndPlaceTile placement legality + adjacency/topology basics
  * ConvertResources (typed vs untyped grassroots) + payment behavior
  * FormalizeInfluence via Committee
  * Majority tie → no control (ensure production behaves accordingly)
  * Hotspot fully surrounded → resolve path

* [x] For each new fixture, run the update script (or manual hash capture) in a deterministic way and commit the expected hashes.
* [x] Update `CORE-01-OBLIGATIONS.json`:

  * Add `golden:` evidence entries mapping relevant obligations to fixture IDs/files.
  * Keep evidence minimal and high signal.

---

## 9) Acceptance Criteria

* [x] New fixtures exist and pass in integration tests.
* [x] At least one fixture covers each listed CORE cluster above.
* [x] `CORE-01-OBLIGATIONS.json` references the fixtures as evidence.
* [x] No unintended hash drift.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] Fixtures deterministic (seeded) and minimal
* [ ] `pnpm test` passes
* [ ] No temporary files committed

---

## 11) Work Summary (3–7 bullets)

* Created 5 new golden replay fixtures in `packages/integration-tests/test/golden/` covering key CORE-01 mechanics.
* Validated adjacency, Grassroots conversion, Committee formalization, majority ties, and Hotspot resolution.
* Generated deterministic state hashes for all new fixtures using the `golden:update` script.
* Linked these fixtures as implementation evidence in `docs/architecture/CORE-01-OBLIGATIONS.json`.
* Verified compliance using `pnpm audit:core-obligations` and integration tests.

---

## 12) Commands Run (with outcomes)

* `pnpm install` (installed dependencies)
* `pnpm build` (built monorepo)
* `pnpm -C packages/integration-tests run golden:update` (generated hashes)
* `pnpm -C packages/integration-tests test -- golden-replay.test.ts` (verified replays pass)
* `pnpm run audit:core-obligations` (verified registry consistency)

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm -C packages/integration-tests test -- golden-replay.test.ts`
* `pnpm audit:core-obligations`

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in the final commit message `Postflight:` block.

---

## 15) Amendments (append-only)
