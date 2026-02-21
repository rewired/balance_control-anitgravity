# Task 0199 — Remove /docs/hand-off policy + tooling (delete folder, remove CI/script gates)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0199-remove-handoff-policy`  
**Skills:** S08 (PR Hygiene)

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* NONE (process/tooling only; no rule or engine behavior change)

### compliance_notes
* This task changes repository process tooling only (docs + scripts + CI). No gameplay rules, determinism, engine, or UI interaction policy changes.

---

## 1) Intent

Delete the entire **handoff** process surface from the repository:

* Remove `/docs/hand-off/**`
* Remove all scripts and CI checks that require it
* Remove documentation references that treat hand-off as a required workflow step

No questions, no replacements.

---

## 2) Scope (File Map)

### Delete
* `/docs/hand-off/` (entire directory)
* `scripts/verify-handoff.mjs` (or equivalent, if present)

### Update (remove references)
* `AGENTS.md` (remove the “handoff” requirement and any workflow steps referencing it)
* `.github/workflows/*.yml` / `.github/workflows/*.yaml`
  * remove `verify:handoff` from CI job steps (or any direct call to the handoff verifier)
* Root `package.json`
  * remove script entry `verify:handoff` (or equivalent)
  * remove it from `test`/`ci` aggregates if present
* Any docs referencing `/docs/hand-off` as mandatory
  * search: `hand-off`, `handoff`, `verify:handoff`, `verify-handoff`

---

## 3) Constraints

* No other behavioral changes beyond removing the hand-off gate.
* CI must remain green after removal.
* Do not introduce new process requirements to replace hand-off.

---

## 4) Implementation Plan

1. **Repo search**
   * `rg -n "hand-off|handoff|verify:handoff|verify-handoff" .`
2. **Remove directory**
   * delete `/docs/hand-off/**`
3. **Remove verifier**
   * delete `scripts/verify-handoff.mjs` (if present)
4. **Update scripts**
   * remove `verify:handoff` from `package.json`
   * remove it from any aggregated scripts (e.g. `test`, `ci`, `verify:*`)
5. **Update CI**
   * remove steps that run the handoff verifier or reference `/docs/hand-off`
6. **Update AGENTS + docs**
   * remove all mandatory statements referencing hand-off
7. **Verify**
   * run the standard pipeline locally; ensure no references remain

---

## 5) Verification

### Commands
* `pnpm -r lint`
* `pnpm -r test`
* `pnpm -r e2e` (if applicable in your CI baseline)
* `pnpm -r build` (if applicable)
* `rg -n "hand-off|handoff|verify:handoff|verify-handoff" .` returns **no matches** (allowlisted: none)

---

## 6) Acceptance Criteria

* [ ] `/docs/hand-off` directory does not exist.
* [ ] No `verify-handoff` script exists or is referenced.
* [ ] No `verify:handoff` script exists or is referenced.
* [ ] CI workflow no longer references hand-off.
* [ ] `AGENTS.md` contains no hand-off requirement.
* [ ] Repo is clean: ripgrep finds no remaining references.
* [ ] All baseline checks are green (`lint/test/build/e2e` as applicable).

---

## 7) PR Checklist

* [ ] No rule or engine files modified (unless removing a handoff reference inside them)
* [ ] CI updated accordingly
* [ ] All references removed (grep proof included in PR description)
* [ ] No leftover empty directories
* [ ] No accidental deletions outside scope

---

## 8) Work Summary / Proof

* <to be filled during IMPLEMENTING/VERIFYING>
