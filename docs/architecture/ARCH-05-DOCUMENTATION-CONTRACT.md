# ARCH-05 — DOCUMENTATION CONTRACT
Version: 1.0
Status: Normative
Scope: Software Engineering Layer

## PURPOSE
Define mandatory documentation standards to ensure rule traceability, determinism verification, and maintainability.

## 1. FORMAT
- TSDoc (`/** ... */`) is required for all documented symbols.

## 2. SCOPE
Required on:
- All exported symbols in `packages/game`.
- All exported symbols in `packages/expansion-*` that implement or mutate authoritative rules.
- `enumerateLegalIntents` and all move resolvers.
- Any function that mutates authoritative state.
Recommended elsewhere.

## 3. REQUIRED TAGS (Minimum Set)
- `@rule <RULE_ID>`: (e.g., `@rule CORE-01-06-16`). Required for any function implementing or resolving a specific game rule.
- `@deterministic`: Required for engine rule execution paths to assert absence of side effects or non-deterministic inputs.
- `@pure` OR `@sideEffects`: Exactly one must be used explicitly.
- `@remarks`: Required when the logic is non-obvious or requires architectural context.
- `@usesRNG`: Required when consuming RNG; must reference `CORE-01-03-02A`.
- `@expansion EXP-01|02|03`: Required when code is expansion-scoped.
- `@requires <SPEC>`: Optional; use when the function depends on a specific subsystem.
- `@see <file or spec anchor>`: Optional.

## 4. RULE BINDING POLICY
- Every rule-resolving function MUST reference at least one SPEC rule ID via the `@rule` tag.
- If a function is cross-cutting, it may reference multiple rule IDs, but MUST be precise.

## 5. CONSISTENT RULE-ID REFERENCES (Non-Negotiable)
To prevent "creative" or ambiguous rule usage:
- The `@rule` value MUST be the exact canonical rule anchor token from the SPEC documents.
  Example: `@rule CORE-01-06-16` (exactly), NOT "Production".
- Preserve casing and separators exactly as in the SPEC:
  - Prefix in uppercase (CORE, EXP, VAR, ADD56).
  - Hyphen-separated numeric segments: `CORE-01-06-16`.
  - Optional letter segments MUST match SPEC exactly: `CORE-01-06-16(a)(3)` if and only if the SPEC uses that anchor.
- Do NOT invent aliases or abbreviations.
- If a function maps to multiple rules, list multiple `@rule` tags (one per rule ID), not a freeform sentence.
- If there is no suitable SPEC anchor, the function MUST be treated as "infrastructure" and must NOT claim a rule binding. In that case:
  - Omit `@rule`.
  - Include `@remarks "infrastructure; no direct SPEC binding"`.

## 6. CLIENT BOUNDARY DOCUMENTATION
- Client modules that read state and could be mistaken as “rule logic” MUST reference `ARCH-01` in `@remarks` and explicitly state "presentation-only".

## 7. TOOLING & ENFORCEMENT
To prevent manual errors and ensure exact compliance with section 5:
- **Registry Generation:** `pnpm run gen:spec-anchors` scans normative markdown in `/docs/rules/` and updates `packages/rules/src/spec-anchors.generated.json`.
- **Compliance Checker:** `pnpm run check:spec-anchors` scans all TypeScript files in `packages/` to ensure every `@rule` or comment-based rule ID exists in the generated registry.
- **CI Gating:** The checker is run as a dedicated step in CI and as a pre-requisite for the root `pnpm test` command.
- **Fixing Violations:** If a violation is found, either update the code to use a valid anchor or, if the spec has changed, regenerate the registry. Never manually edit the generated JSON.
