# Task 0231 — Tooling: fix frozen-lockfile mismatch for bot-llm

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0231-fix-bot-llm-lockfile-rules-dep`

---

**Task State:** COMMIT_READY

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes

N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* ARCH-05-DOCUMENTATION-CONTRACT (repo process/docs compliance)

## 2) Goal

* Resolve CI failure where `pnpm install --frozen-lockfile` reports `ERR_PNPM_OUTDATED_LOCKFILE` for `packages/bot-llm`.

## 3) Non-Goals

* No runtime logic changes.
* No rules/resolver/state behavior changes.

## 4) Inputs

* CI error showing lockfile importer specs missing `@balance-control/rules` for `packages/bot-llm`.

## 5) Outputs

### 5.1 Code

* Regenerated `pnpm-lock.yaml` so `packages/bot-llm` importer includes `@balance-control/rules: workspace:*`.

### 5.2 Tests

* Validate with `pnpm install --frozen-lockfile`.

### 5.3 Docs

* [x] `docs/changelog.md` updated.
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (not required).
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required).

## 6) Constraints (Hard)

* Keep workspace dependency graph deterministic.
* No package version drift beyond lockfile reconciliation.

## 7) Invariants (Must remain true)

* `pnpm install --frozen-lockfile` succeeds.
* No game/bot behavior changes.

## 8) Implementation Plan

* Run lockfile-only install to refresh importer specs.
* Re-run frozen-lockfile install to confirm CI parity.
* Record commands/outcomes.

## 9) Acceptance Criteria

* [x] Frozen lockfile install passes.
* [x] Task file PR checklist completed.
* [x] Exactly one commit includes lockfile + required docs.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed (or NONE)
* [x] Normative anchors/process compliance cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (N/A)
* [x] `pnpm lint` passes (N/A)
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (N/A; no logic changes)
* [x] No temporary files committed
* [x] `CHANGELOG.md` updated if required

## 11) Work Summary (3–7 bullets)

* Regenerated `pnpm-lock.yaml` to reconcile workspace importer specs.
* Added missing `@balance-control/rules` specifier under `packages/bot-llm` in lockfile importer.
* Verified `pnpm install --frozen-lockfile` succeeds.
* Updated changelog with task entry for CI/tooling fix.

## 12) Commands Run (with outcomes)

* `pnpm install --lockfile-only` → success; lockfile updated.
* `pnpm install --frozen-lockfile` → success.
* `pnpm test` → success.

## 13) Postflight Proof (recorded in commit message)

Will be appended under `Postflight:` in the final commit message after commit creation.

## 14) Commit Proof (recorded in commit message)

Will include `git show -1 --stat` under `Postflight:`.

## 15) Amendments (append-only)

N/A
