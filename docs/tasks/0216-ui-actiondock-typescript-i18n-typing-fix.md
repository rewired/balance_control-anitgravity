# Task 0216 — Fix ActionDock TypeScript errors (i18n vars + coach stage typing)

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0216-actiondock-ts-i18n-typing-fix`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-005

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Changes are strictly presentation/typing fixes in `packages/client-web`; no legality/cost/majority computation is introduced or moved into the client.
* GR-005: No new moves/intents are introduced; changes only affect UI text rendering and helper typing.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-06 — ActionDock responsibilities/forbidden commit paths
* ARCH: ARCH-06 — I18N (minimum locales/keys; namespace format)
* ARCH: `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml` → `i18n` section (vars interpolation uses string values)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Restore a green build by fixing TypeScript type errors in `packages/client-web/src/components/ActionDock.tsx`.
* Ensure `useT()` calls match the contract/type signature: `t(key, vars?: Record<string,string>)`.
* Ensure the coach-message helper accepts the actual `vm.stage` type (may be `null`).

---

## 3) Non-Goals

* No UI redesign, layout changes, or interaction-flow changes.
* No engine or rules changes.
* No i18n system redesign (only fix callsites / missing keys if required).

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/components/ActionDock.tsx`
  * `packages/client-web/src/ui/i18n/index.tsx` (authoritative `t()` type)
  * `packages/client-web/src/ui/i18n/en.json`
  * `packages/client-web/src/ui/i18n/de.json`

* Existing behavior summary (current):

  * `pnpm -w build` fails with TS errors in `ActionDock.tsx` (examples from CI):
    - TS2322: passing a `number` into `t(..., vars)` where `vars` requires `Record<string,string>`.
    - TS2345: passing a fallback string into `t(key, vars)` (2nd arg must be an object).
    - TS2345: `vm.stage` includes `null`, but `getCoachMessage(stage, ...)` expects `string | undefined`.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/components/ActionDock.tsx`
  * Convert numeric interpolation vars to strings (e.g. `String(count)`).
  * Remove any fallback-string second arguments from `t(...)` calls.
  * Ensure coach-message helper accepts `stage: string | null | undefined`.
  * Ensure coach-message helper `t` parameter type matches `useT()` (or is compatible).

* If the build reveals missing translation keys (e.g. `core:ui.players`):
  * Add them to both:
    - `packages/client-web/src/ui/i18n/en.json`
    - `packages/client-web/src/ui/i18n/de.json`

### 5.2 Tests

* NONE (type-only compilation fixes). If adding a small unit test is trivial, it must not be required for acceptance.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — **NOT REQUIRED**
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — **NOT REQUIRED**
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — **NOT REQUIRED**

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

* [ ] Freeze task (set Task State = FROZEN).
* [ ] Fix `t()` var typing in ActionDock:
  * [ ] Wrap numeric vars with `String(...)` (e.g. `count: String(moreItems.length)`).
* [ ] Fix `t()` callsites that pass fallback strings:
  * [ ] Replace `t(key, 'Fallback')` with `t(key)`.
  * [ ] If the key does not exist in locales, add it to `en.json` and `de.json`.
* [ ] Fix `getCoachMessage(...)` typing:
  * [ ] Accept `stage: string | null | undefined` so `vm.stage` is type-safe.
  * [ ] Align `t` param type with `useT()` (`Record<string,string>` vars).
* [ ] Run build/tests and confirm no TS errors remain.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] `pnpm -w build` passes (no TypeScript errors).
* [ ] `pnpm -C packages/client-web build` passes.
* [ ] No behavior changes beyond text rendering/typing (no new commit paths, no new actions).

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Fixed TypeScript errors in `ActionDock.tsx` related to `t()` and `getCoachMessage`.
* Updated `getCoachMessage` signature to accept `string | null | undefined` for `stage`.
* Wrapped numeric variable `count` in `String()` for `core:group.moreActions`.
* Removed fallback strings from `t()` calls and added missing keys to `en.json` and `de.json`.
* Verified build passes with `pnpm -C packages/client-web build`.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → passed (warning about TS version ignored as unrelated)
* `pnpm test` → passed (all packages)
* `pnpm -C packages/client-web build` → passed

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

Format (append one block per amendment):

### A-01 — <short title>

* Reason: <why the change is necessary>
* Change: <what changed (describe, don’t rewrite earlier sections)>
* Spec anchors: <added/changed anchors>
* Guardrails: <GR-xxx impacted>
