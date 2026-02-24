# Task 0224 — UI: Fix PublicNoticeOverlay `tileId` typing

**Date:** 2026-02-23
**Owner:** codex
**Branch:** `task/0224-ui-public-notice-overlay-tileid-typing`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

- **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
- **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
- During **IMPLEMENTING/VERIFYING:** you may only:
  - check boxes in **Section 10**
  - fill **Sections 11–14** (Work Summary / Commands / Proof)
- If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

- **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

- GR-002

### compliance_notes (required if affected_guardrails != NONE)

- GR-002: UI remains presentation-only; this change only tightens conditional rendering so `Tile` receives a definite `string` `tileId`.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

- CORE: N/A (no rules/engine behavior change)
- EXP-01: N/A
- EXP-02: N/A
- EXP-03: N/A
- ARCH: ARCH-01:CLIENT_RESTRICTIONS

Rule:

- If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

- Fix `pnpm -w build` failing due to `PublicNoticeOverlay.tsx` passing `string | undefined` into `Tile.tileId`.
- Preserve existing runtime behavior: only render the discarded tile preview when the tile exists in `G.tiles`.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

- No changes to engine logging (`G.engine.attributes.publicLog`) format or semantics.
- No changes to tile rendering visuals, layout, or interactions beyond type-safety.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

- Repo areas:
  - `packages/client-web/src/components/PublicNoticeOverlay.tsx`
  - `packages/client-web/src/components/Tile.tsx`
- Existing behavior summary (current):
  - Build fails because `latest?.tileId` is `string | undefined`, but `Tile` requires `tileId: string`.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

- `packages/client-web/src/components/PublicNoticeOverlay.tsx`

### 5.2 Tests

- N/A (type-level fix; rely on existing test suite)

### 5.3 Docs

- [ ] `/docs/changelog.md` updated (N/A — no logic/state/resolver change)
- [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
- [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

- Determinism: no time, no Math.random, no non-seeded sources.
- Engine authority: rules/legality/costs computed only in `packages/game`.
- No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
- No implicit rules: if spec does not state it, it does not exist.
- Expansion isolation: disabled expansions must not leak state, hooks, counters.
- Canonical services only:
  - `computeMajority(...)` is single source of truth.
  - `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash.
- State is JSON-serializable; no functions; no derived caches.
- Every object exists in exactly one zone.
- UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

- [ ] Update `PublicNoticeOverlay` conditional so `Tile` is only rendered when `tileId` is definitely a `string`.
- [ ] Run `pnpm -w build` and `pnpm -w test`.
- [ ] Update this task file Sections 10–14, then create a single commit with required postflight proof.

Notes:

- If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

- [ ] `pnpm -w build` passes.
- [ ] `pnpm -w test` passes.
- [ ] `PublicNoticeOverlay` still renders the tile preview only when `latest.tileId` is present and exists in `G.tiles`.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

- [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (if touched)
- [x] `pnpm lint` passes
- [x] `pnpm test` (or `pnpm vitest run`) passes
- [x] Determinism verified (golden replay/state hash)
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

- Fix `PublicNoticeOverlay` conditional rendering so `Tile` only receives a definite `string` `tileId`.
- Restore `pnpm -w build` for `packages/client-web` without changing engine/state behavior.
- Validate via `pnpm -w lint` and `pnpm -w test`.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

- `pnpm -w build` → ok
- `pnpm -w test` → ok
- `pnpm -w lint` → ok

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

- `git status -sb`
- `git diff --stat`
- tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

- After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

N/A
