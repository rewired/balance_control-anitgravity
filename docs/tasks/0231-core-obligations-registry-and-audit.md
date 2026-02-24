# Task 0231 — Core obligations registry + audit: classify CORE-01 IDs (normative vs informative) and validate evidence

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0231-core-obligations-registry-and-audit`

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
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Audit output is deterministic (stable sorting, no time/random, byte-stable report output).
* GR-002: Audit tooling is read-only; no legality/cost/majority logic is moved outside `packages/game`.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: `docs/rules/000-core.md` (CORE v1.1.0 canonical source)
* ARCH: ARCH-05:REQUIRED_TAGS
* ARCH: ARCH-05:RULE_BINDING_POLICY
* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Introduce an explicit **obligations registry** for CORE-01 that distinguishes **normative obligations** (must be evidenced) from **informative/explanatory** spec text (no engine evidence required).
* Add a deterministic `pnpm audit:core-obligations` command that validates registry ↔ spec consistency and produces a machine-readable report.
* Establish a baseline without changing engine behavior.

---

## 3) Non-Goals

* No gameplay/engine behavior changes.
* No attempt to “auto-classify” obligations as normative vs informative at runtime (classification is explicit and reviewed).
* No expansion coverage.
* No CI hard-gate yet (that happens in Task 0235).

---

## 4) Inputs

* Repo areas:

  * `docs/rules/000-core.md`
  * `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md`
  * `docs/architecture/SPEC-AUDIT.md`
  * `scripts/gen-spec-anchors.mjs` (style reference)
  * `scripts/check-spec-anchors.mjs` (style reference)
  * `packages/game/src/**` (evidence target)
  * `packages/game/test/**` (evidence target)
  * `packages/integration-tests/test/golden/**` (evidence target)

* Existing behavior summary (current):

  * `audit:spec` checks anchors, invariants, and golden replays, but it does not express “which CORE rule IDs are normative vs informative” or how evidence maps to them.

---

## 5) Outputs

### 5.1 Code

* `scripts/audit-core-obligations.mjs`
* `package.json` (new script: `audit:core-obligations`)

### 5.2 Tests

N/A

### 5.3 Docs

* `docs/architecture/CORE-01-OBLIGATIONS.json` (new, canonical registry)
* `docs/architecture/core-obligations.report.json` (generated, committed baseline)
* [ ] `docs/architecture/SPEC-AUDIT.md` updated (mention this audit stage as optional baseline; do NOT gate yet)

---

## 6) Constraints (Hard)

* **Registry must be explicit:** Every CORE-01 ID from `docs/rules/000-core.md` must exist exactly once in `CORE-01-OBLIGATIONS.json`.
* **No “ID exists” shortcuts:** A rule ID being referenced in code is not sufficient. Normative obligations must have explicit evidence entries.
* **Classification is required:** Each entry must have `class` in {`NORMATIVE_ENGINE`, `NORMATIVE_STATE`, `NORMATIVE_DATA`, `NORMATIVE_UI`, `INFORMATIVE`, `DERIVED`}.
* **Evidence requirement:**

  * For `NORMATIVE_*`: `evidenceRequired=true` and `evidence.length>=1`.
  * For `INFORMATIVE`: `evidenceRequired=false` and `notes` must be non-empty (why it is informative).
  * For `DERIVED`: `evidenceRequired=false`, `derivedFrom` must be non-empty, and `notes` must explain the derivation.

* **Determinism:** stable sorting everywhere (IDs, file lists, evidence lists).
* **Scope:** core only (ignore `001-expansion*.md`).
* **No scanning build output / node_modules.**
* **No PII in tooling output** (do not print local usernames/emails/absolute paths; use repo-relative paths).

---

## 7) Invariants (Must remain true)

* `pnpm test` remains green.
* `pnpm audit:spec` remains green.
* No runtime semantics change (only tooling/docs).

---

## 8) Implementation Plan

* [ ] Define `docs/architecture/CORE-01-OBLIGATIONS.json` schema and content:

  * Include `schema_version`, `spec` (path + version), and `entries[]`.
  * Each entry includes: `id`, `text` (verbatim or lightly normalized), `class`, `evidenceRequired`, `evidence[]`, `notes?`, `derivedFrom?`.

* [ ] Implement `scripts/audit-core-obligations.mjs`:

  1) Parse `docs/rules/000-core.md` and extract `(id, text)` pairs (one line per ID).
  2) Load `CORE-01-OBLIGATIONS.json`.
  3) Validate:

     * spec IDs == registry IDs (no missing, no extras)
     * no duplicate IDs
     * all entries satisfy class/evidence rules above

  4) Write `docs/architecture/core-obligations.report.json` containing:

     * totals by class
     * `missingInRegistry`, `extraInRegistry`, `invalidEntries`
     * `normativeMissingEvidence` (IDs)
     * `evidenceOrphans` (evidence refs that point to missing files/fixtures)

* [ ] Add root script `audit:core-obligations` that runs the node script and writes the report.
* [ ] Update `docs/architecture/SPEC-AUDIT.md` to mention this stage as a *non-blocking* baseline.
* [ ] Run `pnpm audit:core-obligations` twice to confirm byte-stable output.

Notes:

* If the spec contains ambiguous lines (normative vs informative), choose the conservative approach:

  * Prefer `NORMATIVE_*` if the line constrains engine behavior/state/data.
  * Use `INFORMATIVE` only with a clear `notes` rationale.

---

## 9) Acceptance Criteria

* [ ] `CORE-01-OBLIGATIONS.json` covers **100%** of CORE-01 IDs (no unclassified IDs).
* [ ] `pnpm audit:core-obligations` writes `core-obligations.report.json` and prints a deterministic summary.
* [ ] Running the command twice without changes yields byte-identical report output.
* [ ] No engine behavior changes; all existing tests still pass.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No runtime/engine behavior changes
* [ ] Determinism verified for generated report
* [ ] `pnpm lint` passes
* [ ] `pnpm test` passes
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
