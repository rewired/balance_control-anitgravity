# task(0226): Engine: prevent legal-intent enumeration stack overflow (avoid large spread pushes)

- Date: 2026-02-23
- Owner: Codex
- Status: DRAFT
- Task Key: `task/0226-engine-legal-intents-avoid-spread-stackoverflow`

---

## 0) Guardrails Gate (MUST)

### affected_guardrails

* GR-004
* GR-013

*(OR write exactly: `NONE`)*

### compliance_notes (required if affected_guardrails != NONE)

- GR-004: `enumerateLegalIntents(G, ctx, playerID)` remains the single legal-action surface; fix must keep enumeration pure/deterministic and non-throwing under large intent sets.
- GR-013: Bot/UI consume legal intents; preventing runtime crashes preserves the contract that enumeration is always callable.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* docs/architecture/ARCH-01-ENGINE-CONTRACT.md: legality enumeration surface (`enumerateLegalIntents(...)`) must be engine-owned and pure
* docs/architecture/ARCH-03-MEASURE-CPU.md: enumeration must not mutate engine state / must be safe to call from UI

---

## 2) Goal

- Prevent `RangeError: Maximum call stack size exceeded` during intent enumeration in states where a move type (notably ConvertResources) can generate very large intent arrays.
- Keep output semantics unchanged (same intent set + deterministic ordering under the existing `LEGAL_INTENT_BUDGET`).

---

## 3) Non-Goals

- No rule changes.
- No changes to move legality/cost validation.
- No UI error boundary work (engine-side fix only).

---

## 4) Inputs

- Reported runtime error:
  - `RangeError: Maximum call stack size exceeded` at `packages/game/src/engine/legal-intents.ts` when adding ConvertResources intents.
- Relevant code:
  - `packages/game/src/engine/legal-intents.ts` (stage `politicalAction` intent aggregation)

---

## 5) Outputs

### 5.1 Code

- Replace large `array.push(...hugeArray)` patterns in `enumerateLegalIntents` with a non-spread append that cannot overflow the JS argument stack.

### 5.2 Tests

- Add a regression test that constructs a state where ConvertResources enumeration exceeds typical spread-argument limits and asserts enumeration does not throw.

### 5.3 Docs

- Update `/docs/changelog.md` with the runtime fix note.

---

## 6) Constraints (Hard)

- Must remain deterministic (`@deterministic`) and pure (`@pure`): no state mutation, no time-based behavior.
- Must not change legality semantics (only aggregation mechanics).

---

## 7) Invariants (Must remain true)

- `enumerateLegalIntents(...)` remains the only legality enumeration surface (GR-004).
- Enumeration must be safe for UI/bot callers and never require try/catch to avoid crashing (GR-013).

---

## 8) Implementation Plan

1) Replace spread-based aggregation in `enumerateLegalIntents` with safe append.
2) Add regression coverage for the crash scenario.
3) Update `/docs/changelog.md`.
4) Run `pnpm test`.

---

## 9) Acceptance Criteria

- [ ] Legal-intent enumeration no longer throws `RangeError` in large ConvertResources scenarios.
- [ ] Existing legal-intent ordering/determinism tests still pass.
- [ ] `pnpm test` passes.

---

## 15) PR Checklist (to be filled during implementation)

- [x] Preflight: read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- [x] Engine/client boundary respected (ARCH-01)
- [x] Determinism preserved (no Date.now/Math.random)
- [x] Tests updated/added as needed and pass
- [x] Task file updated with Work Summary + Commands Run
- [ ] Single meaningful commit with Postflight block

### Work Summary

- Replaced spread-based intent aggregation in `enumerateLegalIntents` with safe appends to avoid JS argument-stack overflow when an enumerator returns very large arrays.
- Added a regression test that exercises a large ConvertResources enumeration scenario and asserts enumeration does not throw and still respects `LEGAL_INTENT_BUDGET`.
- Documented the runtime fix in `/docs/changelog.md`.

### Commands Run

- `pnpm -C packages/game test -- -t "spread overflow"` (pass)
- `pnpm lint` (pass)
- `pnpm test` (pass)
