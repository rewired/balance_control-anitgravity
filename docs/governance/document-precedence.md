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

## Missing classes (applicability rule)

If a class in the precedence order has no applicable artifact for the current task, **skip that class and continue to the next available class in order**.

* Applicability is determined by the task scope (files touched, subsystem, and in-scope contract files).
* Do not block implementation waiting for a class artifact that does not exist for this scope.
* Task artifacts must explicitly record which classes were present and which were absent.

## Canonical locations / scope

Use these canonical locations to determine whether a class is present and applicable:

* **SEC** → Security/standard contract artifacts in `docs/architecture/` (for example `ARCH-*` normative contracts and master guardrails).
* **DD** → Design Decision artifacts in `docs/design-decisions/` (`DD-*.md`).
* **TDD** → Task Decision artifacts in `docs/tasks/` (`<task_id>-*.md`, including this task's file).
* **AGENTS** → `AGENTS.md` files in the current scope tree (nearest file in directory ancestry wins for overlapping scope).
* **VISION** → Vision/product-intent artifacts (for example `VISION.md` or equivalent long-horizon direction docs when present).
