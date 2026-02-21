# Task 0178 — PG-5: Expansions → Other as collapsible panel (draft-only)

**Date:** 2026-02-21  
**Owner:** Codex  
**Branch:** `task/0178-ui-expansions-other-collapsible`
**Skills:** S01 (Repo Scan), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002
* GR-005
* GR-006

### compliance_notes
* GR-002: Collapsible UI only; “Other” entries remain engine-enumerated intents.
* GR-005: “Other” remains a fallback list; no new action types introduced.
* GR-006: Panel must not be interactive while hard-gated.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `action_taxonomy.others_fallback.location`
* ARCH-06: `action_taxonomy.others_fallback.rule.legal_intents_not_mapped_to_known_action_types_must_be_listed_here`
* ARCH-06: `action_taxonomy.others_fallback.rule.selection_is_always_draft_then_confirm`
* ARCH-06: `commit_policy.normal_moves.require_explicit_confirm`
* ARCH-06: `surfaces.ActionDock.responsibilities.action_selection`
* ARCH-06: `surfaces.ActionDock.forbidden.direct_commit`

---

## 2) Goal

* Render **Expansions → Other** as a collapsible panel (closed by default) to keep the dock readable.
* Panel must always use **draft → confirm** (`controller.proposeIntent(...)`, never commit).
* Panel content must remain deterministically ordered (Task 0177 prerequisite).

---

## 3) Non-Goals

* No changes to the mapping/filter that decides what is “Other”.
* No new labels/i18n infra.
* No changes to PendingChoice UI (PG-4 / separate).

---

## 4) Inputs

### Repo areas
* `packages/client-web/src/components/ActionDock.tsx`
* `packages/client-web/src/ui/useIntentViewModel.ts` (ordering from Task 0177)

### Existing behavior summary (current)
* “Expansions → Other” is shown as a plain list when `vm.political.others.length > 0` (always expanded).

---

## 5) Outputs

### 5.1 Code
* `packages/client-web/src/components/ActionDock.tsx`
  * Wrap “Expansions → Other” list in a collapsible element.
  * Prefer native `<details><summary>…</summary>…</details>` (no new deps).
  * Summary includes count, e.g. `Expansions → Other (3)`.
  * Buttons still call `controller.proposeIntent(intent)`.

### 5.2 Tests
* `packages/client-web/test/action-dock.test.tsx`
  * Add/adjust test:
    * summary exists when others exist
    * open panel and click an item
    * `proposeIntent` called exactly once

### 5.3 Docs
* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* No auto-commit. No `moves.*` and no `dispatchIntent(...)` calls from components.
* Deterministic rendering: no reliance on object key iteration without sorting.
* No cross-imports outside package exports.

---

## 7) Invariants (Must remain true)

* “Other” selection always results in `draftReady`, requiring explicit Confirm in dock.
* When `interactionState === 'draftReady'`, group list stays hidden.

---

## 8) Implementation Plan

* [ ] Step 1: Wrap “Expansions → Other” list in collapsible container (default closed).
* [ ] Step 2: Ensure click handler only proposes intent (draft).
* [ ] Step 3: Update tests for collapsible UI.
* [ ] Step 4: Run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] “Expansions → Other” is collapsible and closed by default.
* [ ] Clicking an “Other” entry proposes a draft (does not commit).
* [ ] Tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails listed + compliant
* [ ] Anchors cited
* [ ] `pnpm lint` passes
* [ ] `pnpm -C packages/client-web test` passes

---

## 11) Work Summary (3–7 bullets)

* <fill during implementation>

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → …
* `pnpm -C packages/client-web test` → …

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)
