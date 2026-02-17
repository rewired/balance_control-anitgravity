# Codex Task 0097 - Documentation Contract (TSDoc + Rule Binding) + AGENTS Policy Hook

**Date:** 2026-02-17
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** AGENTS.md (repo root)

---

## Goal

Introduce a mandatory documentation standard for the monorepo and make it enforceable by policy.

This task MUST:
1) Add a new normative architecture contract: ARCH-05-DOCUMENTATION-CONTRACT.md
2) Update AGENTS.md so the documentation requirement is explicitly part of the repository policy.

No runtime behavior changes.

---

## Referenced Specifications (aliases defined in ARCH-01)

- SPEC-CORE-01 = /docs/rules/000-core.md
- SPEC-EXP-01  = /docs/rules/001-expansion01.md
- SPEC-EXP-02  = /docs/rules/002-expansion02.md
- SPEC-EXP-03  = /docs/rules/003-expansion03.md

If these aliases are moved in the future, ARCH-01 is the single source of truth.

---

## Inputs

- /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- /docs/architecture/ARCH-02-STATE-SHAPE.md
- /docs/architecture/ARCH-03-MEASURE-CPU.md
- /docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md
- AGENTS.md (repo root)

---

## Outputs

### A) Add new architecture contract

Create:

- /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md

ARCH-05 MUST define:

1) **Format**
- TSDoc (/** ... */) is required for documented symbols.

2) **Scope**
- Required on:
  - All exported symbols in packages/game
  - enumerateLegalIntents and all move resolvers
  - Any function that mutates authoritative state
- Recommended elsewhere.

3) **Required tags (minimum set)**
- @rule <RULE_ID>         (e.g. CORE-01-06-16)
- @deterministic          (required for engine rule execution paths)
- @pure OR @sideEffects   (exactly one; explicit)
- @remarks                (required when non-obvious)
- @usesRNG                (when consuming RNG; must reference CORE-01-03-02A)
- @expansion EXP-01|02|03 (when code is expansion-scoped)
- @requires <SPEC>        (optional; when useful)
- @see <file or spec anchor> (optional)

4) **Rule binding policy**
- Every rule-resolving function MUST reference at least one SPEC rule ID.
- If a function is cross-cutting, it may reference multiple rule IDs, but MUST be precise.

5) **Mini-rule: Consistent Rule-ID References (Non-Negotiable)**
ARCH-05 MUST include a short, explicit rule that prevents "creative" @rule usage.

Required format rules:
- The @rule value MUST be the exact canonical rule anchor token from the SPEC documents.
  Example: "@rule CORE-01-06-16" (exactly), not "Production", not "Core production rule".
- Preserve casing and separators exactly as in the SPEC:
  - Prefix in uppercase (CORE, EXP, VAR, ADD56)
  - Hyphen-separated numeric segments: CORE-01-06-16
  - Optional letter segments MUST match SPEC exactly: CORE-01-06-16(a)(3) if and only if the SPEC uses that anchor.
- Do NOT invent aliases or abbreviations.
- If a function maps to multiple rules, list multiple @rule tags (one per rule ID), not a freeform sentence.
- If there is no suitable SPEC anchor, the function MUST be treated as "infrastructure" and must NOT claim a rule binding. In that case:
  - omit @rule
  - include @remarks "infrastructure; no direct SPEC binding"
  - and the task author must decide whether a new SPEC anchor is needed.

6) **Client boundary documentation**
- Client modules that read state and could be mistaken as “rule logic” MUST reference ARCH-01 in @remarks and explicitly state "presentation-only".

### B) Update AGENTS.md (policy hook)

Update AGENTS.md so this is enforced by repo policy:

1) Add ARCH-05 to "Primary Architecture Contracts" list.
2) Add a short subsection under the "Execution Protocol (Non-Negotiable)" (or equivalent) stating:
   - Documentation is mandatory for task completion when touching engine or client state boundaries.
   - TSDoc + required tags are required as per ARCH-05.
   - PRs that change engine behavior MUST keep rule bindings (@rule) accurate and canonical.

Keep wording strict and unambiguous.

---

## Constraints

- Do NOT change runtime behavior.
- Do NOT introduce new dependencies.
- Keep all text ASCII-only where required by repo conventions.
- Preserve existing ARCH-01..04 meaning; only extend with ARCH-05.

---

## Invariants

- Engine/client separation remains authoritative (ARCH-01).
- No derived state introduced (ARCH-02).
- Deterministic resolution order remains unchanged (ARCH-03).

---

## Acceptance Criteria

- ARCH-05 exists and is clearly normative.
- AGENTS.md references ARCH-05 and states documentation is policy.
- ARCH-05 contains the mini-rule for consistent @rule anchors (no invented names).
- No code behavior changes.

---

## PR Checklist

- [ ] /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md added
- [ ] AGENTS.md updated (ARCH-05 listed + doc policy section)
- [ ] ARCH-05 includes canonical @rule mini-rule
- [ ] No runtime changes
- [ ] Encoding UTF-8, no BOM
- [ ] No trailing whitespace
- [ ] Meaningful commit message
