# TASK 0227 — Engine: Collapse fungible payment combinations for ConvertResources legal intents

**Date:** 2026-02-23  
**Status:** DRAFT  
**Owner (Execution):** Codex / Gemini  
**Author (Concept):** ChatGPT  

> **Concept-only task:** specify *what* and *why*. Implementation details are delegated.

---

## Affected Guardrails (Non‑Negotiable)

- ARCH-01 Engine/Client Separation: engine enumerates legality; client renders only.
- Determinism: stable intent ordering, no RNG, replay-safe.
- ARCH-06 UI Interaction Contract: UI must show meaningful choices only (no combinatorial lists).

## Spec Anchors / Contract Bindings (Normative)

- CORE ConvertResources payment/declare semantics (locked declaration before payment).
- Legal-intent enumeration contract (pure, deterministic).

---

## Goal

Prevent ConvertResources ("Umwandeln") from enumerating combinatorially many legal intents that differ only by the identity/IDs of fungible resource tokens (e.g., RES_DOM_1 vs RES_DOM_12). Legal intents must encode only *meaningful* player choices (variant / output resort / penalty resort), while token selection for payment becomes deterministic and automatic.

## Non‑Goals

- No balance changes (costs/recipes/outputs unchanged).
- Do not remove token IDs from state if they are still needed elsewhere; only stop exposing them as selectable choice.
- No UI refactor in this task (handled in TASK 0228).

---

## Inputs

- Current ConvertResources intent enumeration (where it expands over payment token IDs).
- Current ConvertResources resolver implementation (how payment tokens are moved).
- Current token model (resource token IDs, sorting, ownership).

## Outputs

- ConvertResources legal intents deduplicated by a meaning-based signature (cost + outputs + penalty), excluding token IDs.
- Resolver picks concrete tokens deterministically to satisfy aggregated costs.
- Tests that prove intent counts do not explode with token supply size.

---

## Constraints

- Enumeration must remain pure/deterministic; stable sort required.
- Resolver token selection must be deterministic and documented (canonical token picking).
- Intent payloads remain small, serializable, and stable across replays.

## Invariants (Must Hold)

- No client-side dedup needed to stay playable (engine must send compact choices).
- Same state ⇒ same intent list (including order).
- If payment cannot be made, move must remain illegal / no-op (as before).

---

## Plan (Concept)

1. Define a *meaningful cost signature* for ConvertResources payment (example: `{DOM:2}` or `{ANY:3}`, plus optional penalty clause), explicitly excluding concrete token IDs.
2. Update/extend the ConvertResources intent shape to include: variant identifier, output resort (if applicable), penalty resort (if applicable), and aggregated cost signature/counts.
3. Modify legal-intent enumeration to generate intents only over meaningful choice dimensions and deduplicate by a canonical key derived from the aggregated signature.
4. Add deterministic ordering: sort by (variantKey, outputResortKey, penaltyKey, costSignatureKey) using explicit comparator(s).
5. In the resolver, implement deterministic token picking to fulfill aggregated costs (e.g., stable-sort candidate tokens by canonical ID and take the first N; for ANY costs, use a deterministic resort preference order and document it).
6. Add regression tests: with N>=10 fungible tokens and cost=2, enumeration returns 1 meaningful option per (variant/output/penalty), not C(N,2).

---

## Acceptance Criteria

- [ ] ConvertResources intent counts no longer scale combinatorially with token supply size.
- [ ] No intent includes a selectable list of `RES_*` token IDs for fungible payment.
- [ ] Resolver still transfers the correct number of tokens and produces correct outputs for the chosen variant/output/penalty.
- [ ] Deterministic replays choose the same payment token IDs given the same state.
- [ ] Unit tests cover intent dedup + canonical ordering.

---

## PR Checklist

- [ ] Engine remains authoritative for legality; client does not invent/deduplicate legality.
- [ ] Deterministic: identical replay ⇒ identical legal intents order + identical state hash.
- [ ] No new hidden state added to `G`; all changes are replay-safe and JSON-serializable.
- [ ] Stable ordering: explicit sort keys, no reliance on object iteration order.
- [ ] Tests added/updated to lock behavior (unit + at least one golden replay).
- [ ] Docs/TSDoc updated for any new intent fields or resolver behavior.


## Notes

- If token identity is *ever* meaningful (rare), it must be modeled as an explicit meaningful choice—not as accidental combinatorics.
- Prefer minimal API churn: add new intent fields rather than rewriting unrelated action plumbing.
