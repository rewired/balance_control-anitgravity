# Task 0098 — Convert EXP-01/02/03 to First-Class Engine Packs

**Date:** 2026-02-17
**Owner:** Codex
**Branch:** `task/0098-expansions-first-class-packs`

---

**Task State:** FROZEN

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

### affected_guardrails

* GR-004
* GR-005
* GR-009
* GR-012

### compliance_notes

* GR-004: Legal actions remain enumerated exclusively by `enumerateLegalIntents`, expanded to include enabled expansion measure takes.
* GR-005: No new “pass” or undefined moves; only expansion-defined TakeMeasure is enumerated.
* GR-009: Measure deck descriptors are expansion-scoped and remain isolated per expansion zones.
* GR-012: Expansion enablement continues to read from match config (`G.meta.cfg.expansions`).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* EXP-01: EXP-01-02-E-01, EXP-01-06-01, EXP-01-06-03, EXP-01-06-04, EXP-01-06-01A
* EXP-02: EXP-02-03-01, EXP-02-03-02, EXP-02-07-00-01
* EXP-03: EXP-03-03-01, EXP-03-03-02, EXP-03-07-00-01
* ARCH: ARCH-01:LEGALITY_ENUMERATION

---

## 2) Goal

* Ensure expansion measure decks are discoverable by the pack registry for intent enumeration.
* Enumerate expansion TakeMeasure intents only when the corresponding expansion is enabled.
* Keep expansion moves legal and isolated in core-only and single-expansion matches.

---

## 3) Non-Goals

* Implement expansion PlayMeasure targeting or countdown placement intent enumeration.
* Alter measure definitions, costs, or effect resolution behavior.
* Modify client UI behavior beyond consuming legal intents.

---

## 4) Inputs

* Repo areas:
  * `packages/game/src/engine/legal-intents.ts`
  * `packages/expansion-01/src/index.ts`
  * `packages/game/test/legal-intents.test.ts`
  * `packages/game/src/expansion-registry.ts`
* Existing behavior summary (current):
  * Legal intents enumerate core actions only; expansion TakeMeasure is omitted.
  * EXP-01 measure deck lacks descriptors for registry-based lookup.

---

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/legal-intents.ts`
* `packages/expansion-01/src/index.ts`

### 5.2 Tests

* `packages/game/test/legal-intents.test.ts`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

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

* [ ] Add EXP-01 measure deck descriptors to the expansion definition.
* [ ] Enumerate enabled expansion TakeMeasure intents in legal intent listing.
* [ ] Add integration tests asserting TakeMeasure intent legality per expansion.

---

## 9) Acceptance Criteria

* [ ] Core-only matches enumerate no expansion intents.
* [ ] Enabling exactly one expansion enumerates TakeMeasure intents for that expansion only.
* [ ] Each expansion has at least one TakeMeasure intent that executes without INVALID_MOVE.
* [ ] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* N/A

---

## 12) Commands Run (with outcomes)

* N/A

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
