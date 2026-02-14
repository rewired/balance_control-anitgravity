# Rules Index and Anchoring

This folder contains the canonical rules for BALANCE // CONTROL.

Canonical vs legacy:
- Canonical CORE rules: docs/rules/000-core.md (CORE-01 v1.1.0).
- Legacy CORE rules: docs/rules/legacy/000-core-v1.0.26.md (for audit/comparison only).

Anchoring policy:
- Rule IDs are the only canonical anchors.
- Headings are not anchors.
- Code and tests must cite rule IDs when referencing spec behavior.

Anchor registry:
- Run `pnpm run gen:spec-anchors` after editing any canonical rules.
- Registry output: packages/rules/src/spec-anchors.generated.json (committed).
- Tripwire tests fail if any referenced rule ID is missing from the registry.

No drift policy:
- If behavior is not stated in the rules, it does not exist.
- If a rule is ambiguous, follow CORE-01-10 and document a design decision before implementing.

Safe updates:
- Never renumber rule IDs.
- If a new version is added, keep the prior version in docs/rules/legacy/.
- Maintain docs/rules/rules_migration_map.yaml with version mapping notes.
