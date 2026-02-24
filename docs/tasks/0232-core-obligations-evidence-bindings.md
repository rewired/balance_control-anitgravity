# Task 0232 — Core obligations evidence: add precise @rule bindings and evidence links (no behavior changes)

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0232-core-obligations-evidence-bindings`

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

* GR-002
* GR-003
* GR-008

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Only documentation tags/evidence pointers are added in engine code; no rule execution is moved to client/tooling.
* GR-003: Tagging and evidence mapping do not introduce nondeterminism.
* GR-008: Evidence must reflect actual implemented behavior; do not “create” rules by tagging infrastructure.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: `docs/rules/000-core.md` (CORE v1.1.0)
* ARCH: ARCH-05:REQUIRED_TAGS
* ARCH: ARCH-05:RULE_BINDING_POLICY
* ARCH: ARCH-05:CONSISTENT_RULE_ID_REFERENCES

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Turn the obligations registry from Task 0231 into something actionable by ensuring **every normative CORE obligation has concrete evidence**.
* Add **precise** `@rule` bindings in authoritative engine code paths for CORE rules.
* Update `CORE-01-OBLIGATIONS.json` evidence fields to point to real code/test/fixture evidence.

---

## 3) Non-Goals

* No gameplay logic changes.
* No new tests (those come in Tasks 0233/0234).
* No expansions.

---

## 4) Inputs

* Repo areas:

  * `docs/architecture/CORE-01-OBLIGATIONS.json`
  * `scripts/audit-core-obligations.mjs`
  * `packages/game/src/**`
  * `packages/game/test/**` (existing tests only; may be referenced as evidence)
  * `packages/integration-tests/test/golden-replay.test.ts` and `test/golden/*.json` (existing fixtures only; may be referenced as evidence)

* Existing behavior summary (current):

  * Many engine functions have some `@rule` tags, but coverage is uneven; some core obligations are cross-cutting and need explicit “DERIVED” treatment rather than fake bindings.

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/**` (TSDoc tags only where appropriate)

### 5.2 Tests

N/A (no new tests in this task)

### 5.3 Docs

* `docs/architecture/CORE-01-OBLIGATIONS.json` updated (evidence filled/curated)

---

## 6) Constraints (Hard)

* **Precision over volume:**

  * Use `@rule` only where the function actually implements/enforces the rule.
  * Prefer multiple specific `@rule` tags over a vague umbrella tag.
  * Do not tag pure infrastructure (ARCH-05: omit @rule; use `@remarks "infrastructure; no direct SPEC binding"`).

* **Evidence types allowed in registry:**

  * `code:` repo-relative path (optionally `:line`)
  * `test:` repo-relative path (optionally `:line`)
  * `golden:` fixture file name or fixture `id`
  * `doc:` when a rule is explicitly informational / glossary

* **No “informative escape hatch”:** do not reclassify a clearly normative rule as `INFORMATIVE` just to satisfy the audit.
* Keep the registry deterministic and reviewable: stable ordering; minimal churn.

---

## 7) Invariants (Must remain true)

* No state-hash drift.
* `pnpm test` stays green.
* `pnpm audit:core-obligations` must improve (fewer / zero `normativeMissingEvidence`).

---

## 8) Implementation Plan

* [x] Run `pnpm audit:core-obligations` and list **top clusters** of `normativeMissingEvidence` by section (Setup / Turn Structure / Control / Effects / Settlement).
* [x] For each missing normative obligation:

  1) Find the authoritative engine locus (enumerator, resolver, settlement, topology adapter).
  2) Add `@rule <ID>` tags in TSDoc at the *real* enforcement point.
  3) Add an evidence entry in `CORE-01-OBLIGATIONS.json` pointing to that locus.

* [x] For obligations that are genuinely not directly bound to a single function:

  * Mark as `DERIVED` and fill `derivedFrom` + a short `notes` rationale.
  * Do **not** pretend it is implemented by tagging random code.

* [x] Re-run `pnpm run check:spec-anchors` and `pnpm audit:core-obligations`.

---

## 9) Acceptance Criteria

* [x] `CORE-01-OBLIGATIONS.json` has **no** `NORMATIVE_*` entry without evidence.
* [x] `pnpm audit:core-obligations` reports `normativeMissingEvidence.length == 0`.
* [x] All added `@rule` tags pass the spec-anchor tripwire (`pnpm run check:spec-anchors`).
* [x] No behavior changes (golden hashes unchanged).

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] Tagging follows ARCH-05 (precise rule binding; infrastructure not tagged)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` passes
* [ ] No temporary files committed

---

## 11) Work Summary (3–7 bullets)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 12) Commands Run (with outcomes)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm lint`
* `pnpm test`
* `pnpm audit:core-obligations`

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in the final commit message `Postflight:` block.

---

## 15) Amendments (append-only)
