# Task 0182 — PG-6: Core locale resources (en/de) + required keys gate

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0182-ui-i18n-core-locales-required-keys`
**Skills:** S01 (Repo Scan), S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-002

### compliance_notes
* GR-002: Locale resources are presentation strings only.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `i18n.required_keys`
* ARCH-06: `i18n.defaults.en`
* ARCH-06: `i18n.defaults.de`
* ARCH-06 Checklist: `9) I18N`

---

## 2) Goal

* Add `en` and `de` locale JSON resources for the **core namespace**.
* Ensure **all required keys** from `ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` exist in both locales.
* Add a small automated gate (test) that fails if any required key is missing.

---

## 3) Non-Goals

* No translation of non-core namespaces (`exp01/exp02/exp03`) yet.
* No runtime locale switch UI.

---

## 4) Inputs

* Contract-required key list:
  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` → `i18n.required_keys`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/i18n/en.json`
* `packages/client-web/src/ui/i18n/de.json`

Structure requirement:

* Keys must be addressable via `ns:path.to.key`.
* Keep this layout stable:
  * `core.group.*`
  * `core.action.*`
  * `core.step.*`
  * `core.ui.*`
  * `core.draft.*`
  * `core.inspector.*`

Required keys (MUST exist in both `en` and `de`):

* `core:group.influence`
* `core:group.committees`
* `core:group.economy`
* `core:group.measures`
* `core:group.expansions`
* `core:action.placeInfluence`
* `core:action.moveInfluence`
* `core:action.formalize`
* `core:action.convert`
* `core:action.takeMeasure`
* `core:step.chooseAction`
* `core:step.chooseSource`
* `core:step.chooseDestination`
* `core:step.chooseTile`
* `core:step.chooseVariant`
* `core:ui.preview`
* `core:ui.confirm`
* `core:ui.cancel`
* `core:ui.changeSource`
* `core:ui.changeDestination`
* `core:ui.changeVariant`
* `core:draft.moveInfluenceSummary`
* `core:draft.placeInfluenceSummary`
* `core:draft.placeTileSummary`
* `core:draft.formalizeSummary`
* `core:draft.convertSummary`
* `core:inspector.activeAction`
* `core:inspector.step`
* `core:inspector.pinnedSource`

Additionally (recommended, because current UI already shows them):

* ActionDock header/stage labels (e.g. Actions, Waiting, Draw & Place, Political Action)
* Variant picker strings (Select, Standard, Extra, Pay, Free)
* Inspector panel labels used in `GameLayout.tsx` (Inspector, No tile selected, Coord, Type, Resort, Weight, Influence, Resources, None)

If adding extra keys, keep them under `core.*` and do not invent new namespaces.

### 5.2 Tests

* Extend `packages/client-web/test/i18n.test.ts` (from Task 0181) or add:
  * `packages/client-web/test/i18n-required-keys.test.ts`

The gate must:

* iterate the required key list above
* assert that for **both** locales the resolved string is not equal to the raw key

### 5.3 Docs

* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* No new user-visible strings in modified components without I18N keys (ARCH-06 checklist).
* Interpolation tokens must use `{{var}}` style (as per ARCH-06 defaults).

---

## 7) Invariants (Must remain true)

* UI remains presentation-only.

---

## 8) Implementation Plan

* [ ] Step 1: Create `en.json` and `de.json` with nested objects and the required keys.
* [ ] Step 2: Ensure draft summary templates use `{{source}}`, `{{target}}`, `{{tile}}`, `{{coord}}` as shown in the contract.
* [ ] Step 3: Add/extend the required-keys test gate.
* [ ] Step 4: Run `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] All required keys exist in both `en.json` and `de.json`.
* [ ] The required-keys test fails if any one key is removed or misspelled.
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately (GR-002).
* [ ] Normative anchors cited.
* [ ] No engine/rule/spec changes.
* [ ] `pnpm lint` passes.
* [ ] `pnpm -C packages/client-web test` passes.
