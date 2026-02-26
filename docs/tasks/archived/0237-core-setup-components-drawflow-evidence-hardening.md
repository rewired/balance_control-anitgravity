# Task 0237 — CORE setup/components/draw-flow evidence hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0237-core-setup-components-drawflow-evidence-hardening`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-004
* GR-005
* GR-010

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: verify setup RNG call order and pre-shuffle canonical order deterministically.
* GR-004/GR-005: verify only legal turn actions are exposed and no phantom setup actions are introduced.
* GR-010: explicitly test Start Committee uniqueness and draw-pile exclusion semantics.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-02-01, CORE-01-02-02, CORE-01-02-03, CORE-01-02-03A, CORE-01-02-04A..G, CORE-01-02-14A, CORE-01-02-17, CORE-01-03-01, CORE-01-03-02A, CORE-01-03-02A.1, CORE-01-03-02A.2, CORE-01-03-02B, CORE-01-03-02B.1, CORE-01-03-03, CORE-01-03-03A, CORE-01-03-03B
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-01:LEGALITY_ENUMERATION

## 2) Goal

* Add deterministic tests covering setup component composition and start-player derivation order.
* Add direct tests for draw-only-during-draw-phase obligation.
* Upgrade weak source-only evidence to executable assertions.

## 3) Non-Goals

* No expansion setup checks.
* No client-web changes.

## 4) Inputs

* Repo areas:
  * packages/game/src/setup.ts
  * packages/game/src/mechanics-draw.ts
  * packages/game/src/packs/core/index.ts
  * packages/game/test/setup.test.ts
  * packages/game/test/unplaceable-draw-redraw.test.ts
* Existing behavior summary (current): multiple setup/component obligations are mapped but not directly asserted in tests by anchor.

## 5) Outputs

### 5.1 Code

* packages/game/src/setup.ts (only if failing tests expose mismatch)

### 5.2 Tests

* packages/game/test/setup.test.ts
* packages/game/test/unplaceable-draw-redraw.test.ts
* packages/game/test/new-core-setup-obligations.test.ts (if needed)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.

## 8) Implementation Plan

* [ ] Step 1: Add failing tests for each listed weak setup/component anchor.
* [ ] Step 2: Fix only behavior that fails, preserving CORE-only determinism.
* [ ] Step 3: Update obligations evidence to point to test names/locations.

## 9) Acceptance Criteria

* [ ] Setup RNG order + shuffle determinism asserted by tests.
* [ ] Start Committee uniqueness and draw exclusion asserted by tests.
* [ ] `pnpm -C packages/game test -- setup.test.ts unplaceable-draw-redraw.test.ts` passes.

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

## 11) Work Summary (3–7 bullets)

* Created `packages/game/test/new-core-setup-obligations.test.ts` to provide executable evidence for CORE-01 setup and component obligations.
* Verified canonical RNG behavior, including seeded determinism and specific call order (Shuffle before Start Player selection).
* Asserted Start Committee uniqueness, initial placement at (0,0), and exclusion from the DrawPile.
* Hardened Grassroots composition evidence (2 untyped, 2 DOM, 2 FOR, 2 INF).
* Updated `docs/architecture/CORE-01-OBLIGATIONS.json` and existing tests with appropriate `@rule` annotations.

## 12) Commands Run (with outcomes)

* N/A

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>
