# Task 0121 — Standardize EXP-01 Measure objectId prefix to `exp01_measure_` and remove legacy `measure_` usage

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0121-exp01-measure-prefix-standardization`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small clarifications, stop and create a follow-up task.

## 0) Masterplan Guardrails (MUST)

- Follow `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (no boundary violations, deterministic engine, packs are data/modules, UI remains presentation-only).
- Follow `AGENTS.md` (single-commit discipline, proof requirements, no drift).

## 1) Primary Spec Anchors (MUST)

- `docs/architecture/ARCH-03-MEASURE-CPU.md`
- `docs/tasks/0120-fix-multi-expansion-measure-dispatch-via-explicit-expansion-scoped-registry-api.md (this task depends on 0120)`
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

## 2) Goal

- Make Measure object IDs consistently namespaced across expansions by changing EXP-01 from `measure_` to `exp01_measure_`.
- Ensure measure deck providers / lookup routing remain unambiguous and future-proof for EXP-04+.
- Update any tests/fixtures referencing old EXP-01 measure object IDs.

## 3) Non-Goals

- No JSONification work here.
- No changes to measure rules or effects semantics.
- No introduction of a compatibility shim that silently accepts the legacy prefix.

## 4) Inputs

- EXP-01 engine pack sources (measure deck object ids / providers).
- `packages/game/src/engine/measure-deck-provider.ts` (provider registration + lookup).
- Search across repo for references to `measure_` object ids in tests/fixtures.
- CI workflow expectations in `.github/workflows/ci.yml` (tests/build commands).

## 5) Outputs

- EXP-01 Measure object IDs renamed to `exp01_measure_*`.
- Provider definitions updated to match the new prefix.
- All references to the old EXP-01 `measure_` object ids removed from tests/fixtures.
- Optional: add a guard that errors deterministically if multiple providers match a single object id.

## 6) Constraints (Hard)

- Do not keep a silent fallback from `measure_` → `exp01_measure_`.
- If a transitional failure is unavoidable, prefer a deterministic error explaining the migration requirement.
- No unrelated refactors; keep diffs tight to ids/providers/tests.

## 7) Invariants (Must remain true)

- Provider lookup remains deterministic and unambiguous.
- Expansion identity is explicit (matches the pack id / registry expansionId).
- No engine-side dependency on expansion implementation details beyond declared pack contracts.

## 8) Implementation Plan

1. Identify where EXP-01 defines Measure object IDs and provider prefixes.
2. Rename the prefix to `exp01_measure_` and update any generation / constants accordingly.
3. Update provider registration and ensure `lookupMeasureDeckForObjectId` resolves EXP-01 correctly.
4. Search/replace repo references to old EXP-01 measure object ids; update fixtures and tests.
5. If the provider lookup currently allows multi-match, add a deterministic error that lists matching providers in canonical order.
6. Run tests and record proof per `AGENTS.md`.

## 9) Acceptance Criteria

- [ ] No occurrences of EXP-01 legacy `measure_` object ids remain in the repo (except in this task file, if mentioned).
- [ ] `lookupMeasureDeckForObjectId` routes EXP-01 measures via `exp01_measure_` without ambiguity.
- [ ] All tests pass and measure dispatch remains correct with multiple expansions registered.
- [ ] Provider multi-match (if possible) yields a deterministic error rather than a silent selection.

## 10) PR Checklist (Repo Artifact)

- [ ] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [ ] Single commit on the task branch.
- [ ] `pnpm -r test` (or the repo-equivalent) executed; results recorded in Section 12.
- [ ] No unrelated formatting churn.
- [ ] Determinism preserved; no order-dependent Map/Object iteration without canonicalization.
- [ ] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- TBD

## 12) Commands Run (with outcomes)

- TBD

## 13) Postflight Proof (recorded in commit message)

- TBD

## 14) Commit Proof (recorded in commit message)

- TBD

## 15) Amendments (append-only)

- None
