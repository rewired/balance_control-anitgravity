# Task 0231 — Core Rule Coverage: generate deterministic report for CORE spec traceability

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0231-audit-core-rule-coverage-report`

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
* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Coverage audit is deterministic (stable sorting, no time/random, byte-stable report output).
* GR-002: Audit tooling is read-only; no rule execution/legality logic is moved outside `packages/game`.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated, I will STOP and write a DD (design decision) or split the task.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-00 (canonical spec source)
* ARCH: ARCH-05:RULE_BINDING_POLICY
* ARCH: ARCH-05:REQUIRED_TAGS
* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Add a deterministic `pnpm audit:core-coverage` command that lists every rule-id present in `docs/rules/000-core.md` and maps it to evidence in repo sources.
* Define a minimal exemption mechanism for spec-only / definitional rules (explicitly listed; not inferred).
* Produce a machine-readable report (counts + missing list) to establish today’s baseline without blocking CI yet.

---

## 3) Non-Goals

* No gameplay/engine behavior changes (comments, scripts, and docs only).
* No attempt to ‘fix’ coverage by adding broad/ambiguous `@rule` tags.
* No expansion coverage in this pass (only IDs sourced from `docs/rules/000-core.md`).

---

## 4) Inputs

* Repo areas:

  * `docs/rules/000-core.md`
  * `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md`
  * `docs/architecture/SPEC-AUDIT.md`
  * `packages/rules/src/spec-anchors.generated.json`
  * `scripts/gen-spec-anchors.mjs`
  * `packages/game/src/**`
  * `packages/game/test/**`
  * `packages/integration-tests/test/**`

---

## 5) Outputs

### 5.1 Code

* `scripts/audit-core-coverage.mjs`
* `docs/architecture/CORE-01-SPEC-ONLY.json`
* `docs/architecture/core-coverage.report.json`
* `package.json (new script: audit:core-coverage)`

### 5.2 Tests

N/A

### 5.3 Docs

* [ ] `docs/architecture/SPEC-AUDIT.md (mention optional coverage report stage + how to run it)`

---

## 6) Constraints (Hard)

* Determinism: stable ordering; report content MUST be byte-identical across repeated runs on the same tree.
* Scope: only rule IDs sourced from `docs/rules/000-core.md` are in-scope; ignore EXP-* files.
* Evidence rules (initial): implemented = `@rule RULE_ID` found in `packages/game/src/**`; tested = `@rule RULE_ID` or plain `RULE_ID` reference found in `packages/game/test/**` or `packages/integration-tests/test/**`.
* Exemptions MUST be explicit: only IDs listed in `docs/architecture/CORE-01-SPEC-ONLY.json` can be treated as spec-only.
* No scanning node_modules/build output; restrict to tracked repo paths.

---

## 7) Invariants (Must remain true)

* `pnpm audit:spec` remains green (this task must not change runtime semantics).
* No state-hash drift: golden replays must continue to match current expected hashes.
* No new rule IDs invented; the audit must only use canonical IDs present in `docs/rules/000-core.md`.

---

## 8) Implementation Plan

* [ ] Implement `scripts/audit-core-coverage.mjs` with a small CLI: (a) collect core IDs from `docs/rules/000-core.md`, (b) collect evidence from source trees, (c) apply explicit exemptions, (d) write `docs/architecture/core-coverage.report.json` with stable ordering.
* [ ] Create `docs/architecture/CORE-01-SPEC-ONLY.json` as an explicit list (start empty or minimal) + include a short schema comment at top describing its purpose.
* [ ] Add root script `audit:core-coverage` that runs the node script and writes the report.
* [ ] Update `docs/architecture/SPEC-AUDIT.md` to mention this report as a non-blocking baseline step (for now).
* [ ] Run `pnpm audit:core-coverage` twice to confirm byte-stable output; commit generated report.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] `pnpm audit:core-coverage` prints a summary (total IDs, implemented, tested, exempt, missing) and writes `docs/architecture/core-coverage.report.json`.
* [ ] Running the command twice without file changes produces an identical report (byte-for-byte).
* [ ] Report includes: `ids` (sorted), `implementedIds`, `testedIds`, `exemptIds`, `missingIds`, and a short `evidence` map for at least missing IDs (file list, stable order).
* [ ] No changes to engine behavior; all existing tests still pass.

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
