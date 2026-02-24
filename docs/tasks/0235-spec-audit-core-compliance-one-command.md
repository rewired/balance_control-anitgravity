# Task 0235 — Spec audit hardening: make `pnpm audit:spec` the definitive CORE v1.1.0 compliance answer

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0235-spec-audit-core-compliance-one-command`

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
* GR-013

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Audit sequence must be deterministic and side-effect free (except for committed generated artifacts).
* GR-012: Audit validates canonical ruleset manifest/versioning before accepting results.
* GR-013: Bot/self-play or replay tooling used by audit must follow the LLM bot contract boundaries (no UI authority leakage).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated, I will STOP and write a DD (design decision) or split the task.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED
* ARCH: ARCH-05:DOCUMENTATION_CONTRACT
* ARCH: ARCH-01:DETERMINISM
* CORE: CORE-01-00 (canonical baseline)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Update the audit pipeline so `pnpm audit:spec` answers: ‘Is the engine compliant with CORE v1.1.0?’ with one deterministic command.
* Integrate the new strict core-coverage gate (from Tasks 0231–0232) into the audit sequence with clear failure messages.
* Ensure audit steps are ordered for fast feedback: anchors/tripwire → coverage → invariants → golden replays.

---

## 3) Non-Goals

* No new gameplay features or refactors.
* No UI contract work (ARCH-06 out of scope unless audit wiring requires docs-only mention).
* No expansion audit changes beyond keeping existing checks intact.

---

## 4) Inputs

* Repo areas:

  * `docs/architecture/SPEC-AUDIT.md`
  * `package.json (audit scripts)`
  * `scripts/gen-spec-anchors.mjs`
  * `scripts/check-spec-anchors.mjs`
  * `scripts/audit-core-coverage.mjs`
  * `packages/game/test/spec-anchor-tripwire.test.ts`
  * `packages/game/test/core-compliance-invariants.test.ts (from Task 0233)`
  * `packages/integration-tests/test/golden-replay.test.ts`

---

## 5) Outputs

### 5.1 Code

* `package.json (audit:spec script ordering + includes core coverage strict)`
* `scripts/audit-core-coverage.mjs (ensure exit codes + concise output suitable for CI logs)`

### 5.2 Tests

N/A

### 5.3 Docs

* [ ] `docs/architecture/SPEC-AUDIT.md (update: exact audit steps + how to interpret failures)`

---

## 6) Constraints (Hard)

* Audit must be deterministic and repeatable; avoid any step that depends on wall-clock time or external services.
* Audit should be legible in CI logs: each stage prints a short header and a concise summary on success/failure.
* If audit generates artifacts (e.g. spec anchors), it must also verify they match committed versions (no silent drift).

---

## 7) Invariants (Must remain true)

* `pnpm audit:spec` passes on the current main branch when all prerequisite tasks are complete.
* Audit failure messages remain actionable (they point to missing IDs/tests/fixtures).

---

## 8) Implementation Plan

* [ ] Reorder and tighten `audit:spec` to a clear deterministic sequence: gen anchors → check anchors → tripwire → core coverage strict → invariants suite → golden replays.
* [ ] Ensure each stage is independently runnable via its own script (so developers can debug locally without running the full audit).
* [ ] Update `docs/architecture/SPEC-AUDIT.md` with the exact command list, expected artifacts, and failure interpretation for the new coverage stage.
* [ ] Run `pnpm audit:spec` end-to-end and verify it is reasonably fast (avoid accidentally running the entire monorepo test suite).

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] `pnpm audit:spec` runs the strict core coverage gate and fails when coverage is incomplete (and passes when complete).
* [ ] SPEC-AUDIT documentation matches the actual command sequence and outputs.
* [ ] CI logs clearly show which stage failed and why (missing rule IDs, failing invariant, or hash drift).

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
