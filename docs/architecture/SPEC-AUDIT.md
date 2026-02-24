# SPEC-AUDIT — CORE v1.1.0 COMPLIANCE GATE
Version: 1.0
Status: Normative
Scope: Tooling / CI

## PURPOSE
Provide a single deterministic command that answers whether the engine is compliant with CORE v1.1.0.
The audit is the authoritative guardrail against spec drift.

## WHAT IS CHECKED
The audit command runs a fixed sequence:
1) Spec anchor generation or verification
2) Spec anchor tripwire (referenced IDs must exist)
3) Core obligations audit (classification and evidence tracking)
4) Invariants suite (core compliance tests)
5) Golden replay hash verification

## INTERPRETING FAILURES
- Anchor generation drift: regenerated anchors differ from committed registry.
- Tripwire failure: a referenced rule ID does not exist in canonical specs.
- Obligations failure:
    - Registry/spec mismatch: CORE-01-OBLIGATIONS.json is out of sync with 000-core.md.
    - Normative missing evidence: a NORMATIVE_* rule has no evidence linked.
    - Evidence orphan: an evidence reference points to a missing file or fixture.
- Invariants failure: core compliance regression in deterministic tests.
- Golden replay failure: state hash drift for a canonical replay fixture.

## UPDATING ANCHORS SAFELY
- Rule IDs are stable and never renumbered.
- When rules are updated, regenerate anchors and review diffs for removals.
- If an ID must be retired, record a deliberate replacement in rule text and code references.

## DEVELOPER WORKFLOW
- Run locally before PR: pnpm run audit:spec
- If audit fails, fix the specific failure class and re-run until clean.
