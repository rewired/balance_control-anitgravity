# TASK 0229 — Regression Guard: Tests to prevent intent explosion for fungible payments

**Date:** 2026-02-23  
**Status:** DRAFT  
**Owner (Execution):** Codex / Gemini  
**Author (Concept):** ChatGPT  

> **Concept-only task:** specify *what* and *why*. Implementation details are delegated.

---

## Affected Guardrails (Non‑Negotiable)

- Determinism: tests stable on CI across platforms.
- Performance: enumeration must be O(choices) not O(combinations) for fungible payment actions.
- ARCH-01: enumeration is pure; resolver is authoritative.

## Spec Anchors / Contract Bindings (Normative)

- Legal-intent enumeration contract (pure/deterministic).
- ConvertResources fungible-payment semantics (token identity not a player choice).

---

## Goal

Lock in the fix with automated tests: any regression that reintroduces combinatorial enumeration over fungible resource token IDs must fail fast. Ensure both engine enumeration and UI rendering remain protected.

## Non‑Goals

- Do not add broad performance benchmarking infrastructure.
- Do not refactor unrelated action enumerators unless they share the same failure mode and can be covered cheaply.

---

## Inputs

- Post-0227 engine implementation and post-0228 UI rendering changes.
- A helper to construct a game state with large personal supplies (>= 20 tokens).

## Outputs

- Engine tests that assert intent counts stay bounded for ConvertResources with fungible supplies.
- Optional runtime assertion/telemetry (dev-only) when intent counts exceed a threshold, pointing to grouping rules.
- UI test that asserts no `RES_` identifiers appear in ConvertResources wizard output.

---

## Constraints

- Keep tests fast: use minimal states and avoid large replays where unnecessary.
- Assertions must be deterministic and avoid timing-based expectations.

## Invariants (Must Hold)

- If intent count grows with token count for fungible payments, tests must fail.
- Golden replay hashes remain stable (or are intentionally updated with clear rationale).

---

## Plan (Concept)

1. Add an engine unit test: create state with N tokens (e.g., 30 DOM) and a recipe that costs 2 DOM; assert enumeration returns 1 meaningful option per distinct (variant/output/penalty), not C(N,2).
2. Add a second test for ANY-cost recipes (if present): increase mixed supplies and assert enumeration scales with recipe variants, not combinations.
3. Add/extend a golden replay that includes ConvertResources with large supplies and verify deterministic state hash.
4. Add a UI-level regression test: render ConvertResources chooser state and assert text content does not include `RES_`.
5. Optionally add a dev-only guardrail: if any action returns >X intents, log a structured warning identifying the action and suggesting dedup signatures (no user-facing spam).

---

## Acceptance Criteria

- [ ] Engine unit tests fail if ConvertResources enumeration grows combinatorially with fungible token supply.
- [ ] Golden replay passes and remains deterministic.
- [ ] UI regression test fails if any `RES_` token ID leaks into displayed options.
- [ ] All new tests run under the existing `pnpm -r test` workflow without flakes.

---

## PR Checklist

- [ ] Engine remains authoritative for legality; client does not invent/deduplicate legality.
- [ ] Deterministic: identical replay ⇒ identical legal intents order + identical state hash.
- [ ] No new hidden state added to `G`; all changes are replay-safe and JSON-serializable.
- [ ] Stable ordering: explicit sort keys, no reliance on object iteration order.
- [ ] Tests added/updated to lock behavior (unit + at least one golden replay).
- [ ] Docs/TSDoc updated for any new intent fields or resolver behavior.


## Notes

- Pick a threshold X that reflects meaningful choice ceilings (e.g., 200) to catch explosions without false positives.
