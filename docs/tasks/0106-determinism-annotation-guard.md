# Codex Task 0106 - Determinism & RNG Documentation Guard (Repo Script)

**Date:** 2026-02-17
**Style:** Codex task contract
**Primary contract:** AGENTS.md (repo root)

---

## Goal

Introduce a repo-local verification script that enforces:
- No Math.random usage (hard fail)
- All RNG consumption sites are annotated (@usesRNG + @rule CORE-01-03-02A)
- Engine exported rule paths have required TSDoc tags per ARCH-05

This is enforcement tooling, not runtime logic.

---

## Referenced Specifications (aliases defined in ARCH-01)

- SPEC-CORE-01 = /docs/rules/000-core.md

Key rule anchor:
- CORE-01-03-02A Deterministic RNG contract

---

## Inputs

- /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md
- packages/game source tree
- existing repo scripts/lint wiring

---

## Outputs

### A) Add verification script

Create a script, e.g.:

- /scripts/verify-docs.mjs (or similar conventional location in this repo)

The script MUST:
1) Fail if "Math.random" occurs anywhere under packages/
2) Detect likely RNG usage sites in packages/game (match project RNG patterns; minimum: search for "random", "RNG", "nextInt", "shuffle", and the engine RNG wrapper usage)
3) For each RNG usage site, require a nearby TSDoc block containing:
   - @usesRNG
   - @rule CORE-01-03-02A
4) For exported functions in packages/game (best-effort static scan; do not require full TypeScript AST if not already used),
   require presence of:
   - @rule (canonical token; see ARCH-05 mini-rule)
   - @deterministic
   - exactly one of @pure/@sideEffects

If full AST tooling is already present in the repo, it may be used. Otherwise implement a robust text-based scan with clear limitations documented in the script header.

### B) Wire into CI / lint

Add a package script (root or appropriate package) that runs the verifier, e.g.:
- "verify:docs": "node scripts/verify-docs.mjs"

Ensure CI runs it in the normal pipeline (where other verification scripts run).

---

## Constraints

- Do NOT add runtime dependencies.
- Prefer no new dev dependencies; use what already exists.
- Do NOT change game behavior.

---

## Invariants

- Determinism remains guaranteed by engine (CORE-01-03-02A).
- No hidden randomness introduced.

---

## Acceptance Criteria

- Verifier fails on Math.random.
- Verifier fails on RNG usage without @usesRNG + CORE-01-03-02A binding.
- Verifier fails on missing required tags for exported engine rule functions.
- Rule IDs are canonical per ARCH-05 mini-rule.
- CI/lint pipeline runs the verifier.

---

## PR Checklist

- [ ] verify-docs.mjs added and documented
- [ ] verify:docs script wired
- [ ] CI runs verify:docs
- [ ] No runtime behavior changes
- [ ] Meaningful commit message
