# TECH-01 — Big Picture (Engine / Packs / Intents)
Version: 1.0
Status: Normative
Scope: Implementation reference (no rules, only contracts)

## Referenced contracts (normative)
- ARCH-01 = /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- ARCH-02 = /docs/architecture/ARCH-02-STATE-SHAPE.md
- ARCH-03 = /docs/architecture/ARCH-03-MEASURE-CPU.md
- ARCH-04 = /docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md
- ARCH-05 = /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md
- ARCH-06 = /docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md

## Referenced specifications (normative)
- SPEC-CORE-01 = /docs/rules/000-core.md
- SPEC-EXP-01  = /docs/rules/001-expansion01.md
- SPEC-EXP-02  = /docs/rules/002-expansion02.md
- SPEC-EXP-03  = /docs/rules/003-expansion03.md

---

## 1) System goal (north star)

BALANCE // CONTROL is a deterministic, authoritative simulation (“engine”) with non-authoritative presentation (“client”).
All legality, costs, majority, modifiers, and effect resolution MUST occur exclusively inside the engine.

The only interaction model for UI and bots is:
1) enumerate legal intents
2) select one intent
3) execute that intent

---

## 2) Non-negotiable invariants

### 2.1 Determinism
- Identical move sequence MUST produce identical resulting state hash.
- All randomness MUST come from a seeded engine RNG included in initial state.

### 2.2 State shape
- Authoritative state MUST be fully JSON-serializable.
- No functions or derived caches in authoritative state.

### 2.3 Zone model
- Every object exists in exactly one zone at any time.
- Expansions define isolated zones; cross-expansion mixing is forbidden unless explicitly specified.

### 2.4 Atomicity (no partial resolves)
- If an action/effect cannot fully resolve (including full payment), it MUST resolve to “no state change”.

---

## 3) Responsibilities by package

### 3.1 Engine (packages/game)
Owns:
- state mutation (moves)
- legality enumeration + validation
- effect resolution order (incl. expansion stacking)
- pending choice gating (ResolveChoice-only window)

### 3.2 Client (packages/client-web)
May:
- render state
- request and display legal intents
- collect user input and submit selected intent

Must NOT:
- compute legality, costs, majority, or modifiers (even “for preview only”).

### 3.3 Bots (packages/bot-llm)
Must:
- select only from enumerateLegalIntents output
Must NOT:
- inspect internal engine structures
- bypass validation

---

## 4) Canonical effect resolution order (Measure CPU)

All multi-stage effects MUST resolve in this order:
1) Prohibition
2) Cost calculation
3) Payment
4) Output modifiers
5) State mutation

If G.engine.pendingChoice exists, ONLY ResolveChoice intents are valid until resolved.

---

## 5) Packs (what they are, what they are not)

A “pack” is a registrable unit that may contribute:

Engine-authoritative contributions:
- moves, validators, legality enumeration hooks
- setup hooks
- zone/object definitions
- measure decks + measure atoms (CPU)

Client-only (non-authoritative) contributions:
- visuals, icons, strings, CSS, rendering helpers
- notation rendering (no semantics)

Pack registration MUST be deterministic and reject duplicates deterministically.

Pack enablement MUST have exactly one canonical source of truth.

---

## 6) Intents: the one true API

An intent MUST be both executable and explainable. It SHOULD carry:
- action type
- fully declared targets
- fully declared payment choices (incl. resolving ANY-choice selections)
- a choice-handle when pendingChoice is active

Preview MUST be engine-derived (simulate intent / dry-run); the client must not re-implement rule logic.

---

## 7) Rule references in code (format contract)

When code references a rule, it MUST use an exact rule ID in a stable tag:

- `@rule CORE-01-04-12B`
- `@rule EXP-02-04-B`
- `@rule EXP-03-10`

No paraphrases. No invented IDs. No “@rule production”.

---

## Appendix A — Machine-readable contract index

```yaml
bc_contracts:
  version: 1
  docs:
    - id: TECH-01
      path: /docs/architecture/TECH-01-BIG-PICTURE.md
      kind: contract
      status: normative
    - id: ARCH-01
      path: /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
      kind: contract
      status: normative
    - id: ARCH-02
      path: /docs/architecture/ARCH-02-STATE-SHAPE.md
      kind: contract
      status: normative
    - id: ARCH-03
      path: /docs/architecture/ARCH-03-MEASURE-CPU.md
      kind: contract
      status: normative
    - id: ARCH-04
      path: /docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md
      kind: contract
      status: normative
    - id: ARCH-05
      path: /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md
      kind: contract
      status: normative
    - id: SPEC-CORE-01
      path: /docs/rules/000-core.md
      kind: spec
      status: normative
    - id: SPEC-EXP-01
      path: /docs/rules/001-expansion01.md
      kind: spec
      status: normative
    - id: SPEC-EXP-02
      path: /docs/rules/002-expansion02.md
      kind: spec
      status: normative
    - id: SPEC-EXP-03
      path: /docs/rules/003-expansion03.md
      kind: spec
      status: normative

  invariants:
    - engine_is_authoritative
    - client_no_rule_duplication
    - state_json_serializable
    - zone_singleton_membership
    - pending_choice_resolvechoice_only
    - cpu_order_prohibition_cost_payment_modifiers_mutation
    - deterministic_pack_registration
    - intents_are_only_external_action_api
