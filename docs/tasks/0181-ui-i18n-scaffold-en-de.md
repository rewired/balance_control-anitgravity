# Task 0181 — PG-6: I18N scaffold (EN default + DE fallback)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0181-ui-i18n-scaffold-en-de`
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

### compliance_notes
* GR-002: I18N is UI-only. No legality/cost/majority/modifier logic is introduced or moved into client code.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* ARCH-06: `i18n.default_locale`
* ARCH-06: `i18n.fallback_locale`
* ARCH-06: `i18n.locales`
* ARCH-06: `i18n.namespaces`
* ARCH-06: `i18n.required_keys`
* ARCH-06 Checklist: `9) I18N`

---

## 2) Goal

* Introduce a minimal I18N layer in `packages/client-web` with:
  * **EN** as default + fallback.
  * **DE** as a second locale.
  * A simple `t(key, vars?)` API usable inside React components.
* Keep the solution lightweight (no external i18n dependency) and deterministic.

---

## 3) Non-Goals

* No UI redesign or behavior refactors.
* No full-application translation sweep; only the contract-required surfaces are handled by subsequent tasks.
* No localization of game content/rules (engine remains unchanged).

---

## 4) Inputs

### Repo areas
* `packages/client-web/src` (React UI)
* `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` (I18N requirements)

### Existing behavior summary (current)
* UI strings are hardcoded in components.
* There is no locale resource system and no `t(...)` API.

---

## 5) Outputs

### 5.1 Code
Add the I18N module (exact filenames may vary, keep it minimal and conventional):

* `packages/client-web/src/ui/i18n/index.ts`
  * exports `I18nProvider`, `useT()` (or `useI18n()`), and a `t(key, vars?)` implementation.
  * supports `ns:path.to.key` key format (e.g. `core:ui.confirm`).
  * supports `{{var}}` interpolation (no HTML, no rich formatting).
  * fallback: missing key in selected locale → fallback to EN → otherwise return the key string.
* `packages/client-web/src/ui/i18n/locales.ts` (optional)
  * loads/exports `en` and `de` locale objects from JSON.

### 5.2 Tests
Add focused unit tests for I18N core behavior:

* `packages/client-web/test/i18n.test.ts`
  * interpolation: `{{source}} → {{target}}`
  * fallback: missing in `de` falls back to `en`
  * missing everywhere returns the key (to surface broken keys fast)

### 5.3 Docs
* [ ] `/docs/changelog.md` updated — N/A (UI-only)
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* EN is **default** and **fallback** (ARCH-06).
* Deterministic behavior: locale selection must not affect engine state or move selection.
* No new user-facing strings in modified components without I18N keys (ARCH-06 checklist).

---

## 7) Invariants (Must remain true)

* UI remains presentation-only (GR-002).
* Deterministic replays remain unchanged (no time-based decisions or RNG use in UI).

---

## 8) Implementation Plan

* [ ] Step 1: Create `src/ui/i18n/` folder and add the provider + hook.
* [ ] Step 2: Implement `t(key, vars?)` with `ns:path` parsing and `{{var}}` interpolation.
* [ ] Step 3: Provide a locale selection strategy that is UI-only and stable:
  * default `en`
  * if `navigator.language` begins with `de`, use `de`
  * allow explicit override via `?lang=de|en` (optional)
* [ ] Step 4: Wire `<I18nProvider>` at the top level (`App.tsx` or `main.tsx`).
* [ ] Step 5: Add `i18n.test.ts` with the minimal coverage above.

---

## 9) Acceptance Criteria

* [ ] `useT()` (or equivalent) returns a function `t(key, vars?)` usable in components.
* [ ] `t('core:ui.confirm')` returns the correct EN string by default.
* [ ] Missing key in DE falls back to EN.
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately (GR-002).
* [ ] Normative anchors cited for all behavior.
* [ ] No engine/rule/spec changes.
* [ ] `pnpm lint` passes.
* [ ] `pnpm -C packages/client-web test` passes.
