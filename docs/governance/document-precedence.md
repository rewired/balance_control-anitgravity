# Document Precedence (Normative)

This order of precedence is **binding** for decisions, interpretation, and conflict resolution in this repository:

1. **SEC**
2. **DD**
3. **TDD**
4. **AGENTS**
5. **VISION**

Short form: `SEC > DD > TDD > AGENTS > VISION`

## In case of conflicts …

If two or more documents contradict each other, the higher-ranked document according to the order above always prevails.

* Lower-priority documents must **not** override higher-priority documents.
* Ambiguous cases must be called out in the task artifact (Guardrails/Assumptions) and clarified via a DD/ADR.
* Until clarified, apply the conservative interpretation in favor of the higher priority.
