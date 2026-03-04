# Task 0328 — Hotspot anchor canonicalization

**Date:** 2026-03-04
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0328-hotspot-anchor-canonicalization`

---

**Task State:** VERIFYING

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD absent, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: CORE-01-06-03B, CORE-01-06-04, CORE-01-06-05, CORE-01-06-06, CORE-01-06-07
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 (documentation/rule binding hygiene)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Replace non-canonical hotspot comment anchor with a canonical ID from generated registry.
* Keep `handleHotspotResolve` rule references aligned to canonical anchors only.
* Verify spec-anchor checker passes after the update.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No behavior change to hotspot resolution logic.
* No changes to game rules text in `/docs/rules/`.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/engine/atoms/hotspot.ts`
  * `packages/rules/src/spec-anchors.generated.json`
* Existing behavior summary (current):

  * Hotspot resolve atom includes inline comment `CORE-01-06-03C` that is not canonical.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

* N/A — engine atom comment/anchor hygiene only.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/engine/atoms/hotspot.ts`

### 5.2 Tests

* N/A (use existing anchor checker command)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

Changelog path policy (hard):

* Do not target `CHANGELOG.md` (root or any alternate path/case variant).
* Historical archived task files may reference legacy changelog paths; do not rewrite archive content solely for path wording.

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Step 1: Identify canonical hotspot reward anchor from generated registry and rules source.
* [ ] Step 2: Replace invalid inline comment anchor in hotspot atom and ensure `@rule` tags are canonical.
* [ ] Step 3: Run spec-anchor check and record results.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] `packages/game/src/engine/atoms/hotspot.ts` no longer references non-canonical `CORE-01-06-03C`.
* [ ] All `@rule` tags in hotspot atom map to IDs present in generated anchors registry.
* [ ] `pnpm run check:spec-anchors` passes.
* [ ] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (fails due to unrelated pre-existing docs verification errors)
* [ ] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`) (not required: no logic/state change)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Replaced non-canonical inline hotspot comment anchor `CORE-01-06-03C` with canonical `CORE-01-06-05` in `handleHotspotResolve` near the majority/controller choice enqueue path.
* Added `@rule CORE-01-06-03B` to the atom TSDoc since the function enforces single-resolution behavior.
* Verified `packages/rules/src/spec-anchors.generated.json` contains the canonical hotspot anchors (`CORE-01-06-03`, `03A`, `03B`, `04`..`08`) and did not require regeneration.
* Ran anchor validation to confirm no unresolved rule IDs remain.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm run check:spec-anchors` → ok (`No invalid rule references found`).
* `pnpm lint` → ok.
* `pnpm test` → fail (pre-existing docs verification failures in `packages/game/src/mechanics-turn.ts` and `packages/game/src/state-lookup.ts`, unrelated to this task).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* N/A — engine atom comment/anchor hygiene only.

If not applicable, write explicit `N/A` with reason.

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

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>
