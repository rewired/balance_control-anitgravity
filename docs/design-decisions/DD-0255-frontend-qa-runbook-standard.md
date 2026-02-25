# DD-0255 — Frontend QA Runbook Standardization (ARCH-06)

**Date:** 2026-02-25
**Status:** Accepted
**Task:** `0255-frontend-qa-runbook-standard`

## Context

Frontend QA expectations (lint/unit/coverage/e2e order, ARCH-06 checklist mapping, and required PR evidence) existed across scripts and prior tasks, but there was no single runbook under `docs/` that teams could cite as a normative process baseline.

This caused process drift risk and inconsistent PR artifact quality for UI/interaction changes.

## Decision

1. Add `docs/testing/frontend-qa.md` as the canonical frontend QA runbook.
2. Define mandatory command order: `lint -> unit -> coverage -> e2e`.
3. Define pass/fail/warn criteria and environment-limitation handling.
4. Map each QA step to ARCH-06 checklist sections.
5. Make required PR artifacts explicit (commands, logs, postflight proof, screenshots for UI-visible changes).
6. Add explicit references in `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md` so future tasks must either follow the runbook or state N/A with reason.

## Consequences

* Positive:
  * QA execution order and evidence expectations become explicit and reusable.
  * ARCH-06 compliance proof becomes easier to audit from task files.
  * UI-visible change reviews get consistent screenshot expectations.
* Trade-offs:
  * Task template has additional required fields for UI/prozess tasks.
  * Contributors must maintain one more normative doc when process evolves.

## Compliance Notes

* No gameplay/rules/resolver behavior changes.
* No client-side legality/cost logic introduced.
* Documentation/process-only change scoped to `docs/`.
