# Task 0227 — Engine: Collapse fungible payment combinations for ConvertResources legal intents

**Date:** 2026-02-23  
**Owner:** Codex  
**Branch:** `task/0227-dedup-fungible-convertresources`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

- **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
- **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
- During **IMPLEMENTING/VERIFYING:** you may only:
  - check boxes in **Section 10**
  - fill **Sections 11–14** (Work Summary / Commands / Proof)
- If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

- **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

- GR-002
- GR-003
- GR-004
- GR-007

### compliance_notes (required if affected_guardrails != NONE)

- GR-002: Deduplicate ConvertResources intent enumeration inside `packages/game` only; UI receives compact intents but does not deduplicate or compute legality.
- GR-003: Remove combinatorial intent generation; ensure stable ordering and deterministic token picking for payments.
- GR-004: Keep ConvertResources legality surfaced only through `enumerateLegalIntents(...)`; enumeration remains pure.
- GR-007: Preserve the action pipeline order: extra costs are paid via cost resolver before base payment and conversion grant atoms resolve.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-04-20
- CORE: CORE-01-04-22
- CORE: CORE-01-04-22K
- CORE: CORE-01-04-22L
- CORE: CORE-01-04-22L.1
- ARCH: ARCH-01:LEGALITY_ENUMERATION
- ARCH: ARCH-03:RESOLUTION_ORDER

---

## 2) Goal

- Prevent ConvertResources ("Umwandeln") from enumerating combinatorially many legal intents that differ only by fungible resource token IDs.
- Ensure ConvertResources legal intents encode only meaningful player choices (variant and output resort), not a selection of fungible token IDs.
- Make payment token selection deterministic and automatic when IDs are omitted.

---

## 3) Non-Goals

- No balance changes: costs/recipes/outputs remain unchanged.
- Do not remove token IDs from state or change the resource token model.
- No UI refactor in this task (handled separately).

---

## 4) Inputs

- Repo areas:
  - `packages/game/src/engine/legal-intents.ts`
  - `packages/game/src/moves/stages/politicalAction.ts`
  - `packages/game/src/move-contracts.ts`
- Existing behavior summary (current):
  - ConvertResources intent enumeration expands over `inputResourceIds` combinations (and extra-cost resource combinations), causing intent counts to scale combinatorially with supply size.

---

## 5) Outputs

### 5.1 Code

- Update `packages/game/src/engine/legal-intents.ts` to stop enumerating fungible token-ID combinations for ConvertResources.
- Update `packages/game/src/move-contracts.ts` and `packages/game/src/moves/stages/politicalAction.ts` so ConvertResources can be executed with an aggregated declaration (no token IDs) and performs deterministic auto-payment.

### 5.2 Tests

- Update `packages/game/test/legal-intents.test.ts` to match the new ConvertResources intent payload shape and to lock intent dedup behavior.

### 5.3 Docs

- [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
- [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
- [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

- Determinism: no time, no Math.random, no non-seeded sources.
- Engine authority: rules/legality/costs computed only in `packages/game`.
- No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
- No implicit rules: if spec does not state it, it does not exist.
- Expansion isolation: disabled expansions must not leak state, hooks, counters.
- Canonical services only:
  - `computeMajority(...)` is single source of truth.
  - Resolver cost/payment flows remain engine-owned.

---

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash.
- State is JSON-serializable; no functions; no derived caches.
- UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

- [ ] Replace ConvertResources intent enumeration with a meaning-based enumeration (tile × variant × output resort), excluding token IDs.
- [ ] Extend ConvertResources move payload to allow aggregated declarations (e.g. `inputCount`) and omit payment token IDs.
- [ ] Implement deterministic auto-payment token picking (canonical ordering by token ID), including for extra costs when IDs are omitted.
- [ ] Update existing tests and add regression assertions that intent counts do not explode with large fungible supplies.

---

## 9) Acceptance Criteria

- [ ] ConvertResources intent counts no longer scale combinatorially with token supply size.
- [ ] No ConvertResources intent requires a selectable list of `RES_*` token IDs for fungible payment.
- [ ] Resolver still transfers the correct number of tokens and produces correct outputs for the chosen variant/output.
- [ ] Deterministic replays choose the same payment token IDs given the same state.
- [ ] Unit tests cover intent dedup + deterministic ordering.

---

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (if touched)
- [x] `pnpm lint` passes
- [x] `pnpm test` (or `pnpm vitest run`) passes
- [x] Determinism verified (state-hash tests + deterministic ordering test)
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

- Collapse ConvertResources intent enumeration to `tile × inputCount × outputResort` (no fungible token-ID combinations).
- Extend ConvertResources move payload to allow `inputCount` declarations and omit payment token IDs.
- Add deterministic, canonical (ID-sorted) auto-selection for base inputs and extra costs when IDs are omitted.
- Update unit tests to lock non-explosive intent counts and meta-marker Convert extra-cost auto-pay behavior.
- Update `/docs/changelog.md`.

---

## 12) Commands Run (with outcomes)

- `pnpm test` → ok
- `pnpm lint` → ok

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file. Record them in the final commit message under `Postflight:` via an amend that changes the message only.

Required commands:

- `git status -sb`
- `git diff --stat`
- tests (e.g. `pnpm test` or `pnpm vitest run`)

### 13.1 Recorded

- N/A (not yet recorded)

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

- N/A (not yet recorded)

---

## 15) Amendments (append-only)

- N/A
