# Task 0229 — Regression Guard: Prevent intent explosion for fungible payments

**Date:** 2026-02-23
**Owner:** Codex
**Branch:** `task/0229-tests-guard-intent-explosion-fungible`

---

**Task State:** COMMIT_READY

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
* GR-004
* GR-002

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Only deterministic tests/fixtures added; no time-based assertions; golden hashes are stable and intentional.
* GR-004: Tests assert `enumerateLegalIntents` remains bounded for ConvertResources under fungible payment (no combinatorial enumeration).
* GR-002: UI regression coverage remains presentation-only (asserts token IDs never leak to rendering; no legality/cost logic added to client).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-04-05A
* CORE: CORE-01-04-22K
* CORE: CORE-01-04-22L
* ARCH: ARCH-01:LEGALITY_ENUMERATION
* ARCH: ARCH-01:DETERMINISM

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Lock in regression guards so ConvertResources legal-intent enumeration stays O(choices), not O(token-combinations), for fungible payment supplies.
* Ensure ConvertResources UI never displays raw resource token IDs (e.g. `RES_*`) in the action dock wizard.
* Extend golden replay coverage to include ConvertResources with large personal supplies and a stable final hash.

---

## 3) Non-Goals

* Do not add timing/benchmark infrastructure (no perf baselines).
* Do not refactor other intent enumerators unless required to make the regression tests deterministic and fast.
* Do not change ConvertResources rules semantics; this is guard coverage only.

---

## 4) Inputs

* Repo areas:

  * `packages/game/src/engine/legal-intents.ts`
  * `packages/game/test/legal-intents.test.ts`
  * `packages/client-web/test/action-dock.test.tsx`
  * `packages/integration-tests/test/golden-replay.test.ts`
* Existing behavior summary (current):

  * `enumerateConvertResources` checks payability via deterministic selection and enumerates variants by (tile × inputCount × outputResort), without listing payment token IDs.

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

* `packages/game/test/legal-intents.test.ts` updated (bounded intent count regression guard)
* `packages/integration-tests/test/golden/*.json` added/updated (ConvertResources golden replay fixture + expected hashes)
* `packages/client-web/test/action-dock.test.tsx` (existing coverage; extend only if needed)

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

* [ ] Add engine unit regression: intent count for ConvertResources is invariant to fungible token supply size.
* [ ] Add integration golden replay fixture that executes ConvertResources with a large seeded personal supply.
* [ ] Ensure UI regression coverage asserts ConvertResources never renders `RES_*` IDs (add/extend test only if required).

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] Engine unit tests fail if ConvertResources enumeration grows combinatorially with fungible token supply.
* [ ] Golden replay includes ConvertResources + large supply and matches expected final hash deterministically.
* [ ] UI regression test fails if any `RES_` token ID leaks into displayed ConvertResources options.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Added unit test coverage ensuring ConvertResources intent enumeration stays invariant to fungible supply size.
* Added an integration golden replay that executes ConvertResources with a seeded large personal supply and asserts a stable final hash.
* Kept UI regression guard in place to ensure ConvertResources rendering never shows raw `RES_*` token IDs.
* Changelog: N/A (tests-only change).

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/integration-tests test -- golden-replay.test.ts` → ok
* `pnpm -C packages/game test -- legal-intents.test.ts` → ok
* `pnpm lint` → ok
* `pnpm test` → ok

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
