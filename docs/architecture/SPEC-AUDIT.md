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
3) Invariants suite (core compliance tests)
4) Golden replay hash verification

## INTERPRETING FAILURES
- Anchor generation drift: regenerated anchors differ from committed registry.
- Tripwire failure: a referenced rule ID does not exist in canonical specs.
- Invariants failure: core compliance regression in deterministic tests.
- Golden replay failure: state hash drift for a canonical replay fixture.

## UPDATING ANCHORS SAFELY
- Rule IDs are stable and never renumbered.
- When rules are updated, regenerate anchors and review diffs for removals.
- If an ID must be retired, record a deliberate replacement in rule text and code references.

## CORE COVERAGE REPORT (Baseline)
In addition to the strict compliance gate, a coverage audit can be generated to track rule-to-code traceability:
- Command: `pnpm run audit:core-coverage`
- Output: `docs/architecture/core-coverage.report.json`
- Exemptions: `docs/architecture/CORE-01-SPEC-ONLY.json` (for spec-only / definitional rules)

This report provides a non-blocking baseline of implementation and test coverage for all rules defined in `docs/rules/000-core.md`.

## DEVELOPER WORKFLOW
- Run locally before PR: pnpm run audit:spec
- Verify coverage baseline: `pnpm run audit:core-coverage`
- If audit fails, fix the specific failure class and re-run until clean.
