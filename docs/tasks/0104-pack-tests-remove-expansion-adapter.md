# Task 0104 — Pack Test Hygiene: Remove ExpansionDefinition Adapter + Upgrade Test Helpers

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0104-pack-tests-remove-expansion-adapter`

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

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---
## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-001
* GR-002
* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Registry continues to accept only `EnginePackDefinition` and remains the single assembly authority.
* GR-002: No rule execution is moved out of engine; only test scaffolding and an adapter are removed.
* GR-003: Test setup becomes deterministic and pack-driven; no implicit conversion paths remain.
* GR-012: Enabled packs remain config-driven; tests can still register custom packs but must do so explicitly.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---
## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:BOOT CONTRACT, ARCH-01:LEGALITY ENUMERATION, ARCH-01:DETERMINISM

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---
## 2) Goal

* `packFromExpansionDefinition(...)` is removed entirely (no legacy adapter path in runtime or tests).
* All tests register packs using `EnginePackDefinition` only.
* Test helpers provide a small, deterministic `makeTestPack(...)` factory to reduce boilerplate and avoid implicit conversion.

---
## 3) Non-Goals

* No changes to the runtime `EnginePackRegistry` behavior beyond removing the legacy adapter export.
* No changes to production code paths unrelated to registry/pack wiring.
* No changes to the ruleset packages (`@balance-control/*`).

---
## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/expansion-registry.ts (contains `packFromExpansionDefinition` today)`
  * `packages/game/src/index.ts (re-exports `packFromExpansionDefinition` today)`
  * `packages/game/test/_helpers/registerPacks.ts`
  * `packages/game/test/expansion.test.ts (and any other tests importing `ExpansionDefinition` or `packFromExpansionDefinition`)`
* Existing behavior summary (current):

  * Tests currently use `registerTestPacks()` which accepts `ExpansionDefinition` and converts it via `packFromExpansionDefinition`.
  * `packages/game/src/index.ts` re-exports `packFromExpansionDefinition`, keeping the adapter publicly reachable.

---
## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/expansion-registry.ts (remove `packFromExpansionDefinition` and any exports)`
* `packages/game/src/index.ts (stop exporting `packFromExpansionDefinition`)`

### 5.2 Tests

* `packages/game/test/_helpers/registerPacks.ts (accept only `EnginePackDefinition`)`
* `packages/game/test/_helpers/makeTestPack.ts (new factory helper, if useful)`
* `packages/game/test/expansion.test.ts (rewrite or replace to test pack registration without ExpansionDefinition)`
* `packages/game/test/* (any direct imports of `packFromExpansionDefinition` removed)`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---
## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions unless explicitly defined by SPEC.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled packs must not leak moves, hooks, modifiers, zones, resources, decks.
* Do not add runtime dependencies.
* After this task, there must be **no** `ExpansionDefinition` usage in `packages/game/test/**` for pack registration.
* No new adapter or “compat” helper may be introduced under a different name.
* Keep the failure mode deterministic (if a test helper rejects invalid inputs, it must do so with a stable error message/order).

---
## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.
* All tests remain able to register custom packs deterministically (via explicit `EnginePackDefinition`).

---
## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Delete `packFromExpansionDefinition` from `packages/game/src/expansion-registry.ts` and remove all references to it.
* [ ] Remove the re-export of `packFromExpansionDefinition` from `packages/game/src/index.ts`.
* [ ] Update `packages/game/test/_helpers/registerPacks.ts` to accept only `EnginePackDefinition[]` (no union with `ExpansionDefinition`).
* [ ] Add a small helper `makeTestPack(...)` (optional but recommended) to build minimal valid `EnginePackDefinition` objects for tests.
* [ ] Update or replace `packages/game/test/expansion.test.ts`: it must validate pack registration and gating using `EnginePackDefinition` only.
* [ ] Search/replace across `packages/game/test/**` for any imports/usages of `ExpansionDefinition` and `packFromExpansionDefinition`; rewrite tests accordingly.
* [ ] Run `pnpm test` and ensure the registry + surface hash tests remain green.

Notes:

* If any test genuinely needs an `ExpansionDefinition` object, that indicates the test is covering the wrong layer. Rewrite it to test the pack layer directly.

---
## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Repo builds and tests pass with `packFromExpansionDefinition` deleted (no references remain).
* [ ] `packages/game/src/index.ts` no longer exports `packFromExpansionDefinition`.
* [ ] All tests register packs via `EnginePackDefinition` (no `ExpansionDefinition` usage for pack registration remains).
* [ ] No new “compat” replacement helper exists.

---
## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] `packFromExpansionDefinition` removed and not replaced
* [ ] Test helper `registerTestPacks` updated to pack-only
* [ ] All affected tests rewritten and still meaningful (no blanket deletes to “make green”)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` passes
* [ ] Surface hash stability tests pass
* [ ] No temporary files committed

---
## 11) Work Summary (3–7 bullets)

* <what changed>
* <why>

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → <ok/fail + details>
* `pnpm test` → <ok/fail + details>
* (optional) `pnpm vitest run <pattern>` → <ok/fail + details>

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file. Record them in the final commit message under a `Postflight:` block (amend message only, no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` output inside the same `Postflight:` block in the final commit message.

---

## 15) Amendments (append-only)

### A-01 — Initial Draft

* Reason: task created.

