# Task 0207 — Engine: PlayerView exposes all PersonalSupply zones (public supply UI)

**Date:** 2026-02-22
**Owner:** Codex
**Branch:** `task/0207-engine-player-view-show-all-personal-supply`

---

**Task State:** DRAFT

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

* GR-001
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: No authoritative state changes; only the `playerView` projection is adjusted.
* GR-003: Determinism unaffected; no RNG changes.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-06 §2.4 Inspector (read-only details; must be possible to show influence/resources distribution)
* ARCH: ARCH-06 §2.1 BoardSurface (presentation is driven by engine state; inspection is read-only)
* CORE: CORE-01-00-02A (PersonalSupply zones exist per player)
* CORE: CORE-01-00-03 (Influence zones include PersonalSupply)
* ARCH: ARCH-01 §STATE_AUTHORITY / §CLIENT_RESTRICTIONS (client renders from engine state; no client-side reconstruction)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* In hotseat/spectator scenarios, the client can see **all players’ PersonalSupply contents** so that:
  * influence supply counts are visible for non-active players
  * resource supply counts are visible for non-active players
* Privacy masking remains in place for:
  * DrawPile contents (still placeholders)
  * Staging zones (player-specific)
  * Player hand zones (player-specific)
* No change to authoritative rules, move legality, or engine state shape.

---

## 3) Non-Goals

* Do not change what is hidden in DrawPile.
* Do not introduce any new hidden-information mechanics.
* Do not change engine setup counts; this task is only about `playerView` visibility.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/index.ts` (`buildPlayerView`, `isZoneVisible`)
  * `packages/client-web/src/components/PlayerResourcesRow.tsx` (expects visible PersonalSupply zones)

* Existing behavior summary (current):

  * `isZoneVisible` hides `PersonalSupply:<otherPlayer>` from the current player’s view.
  * Result: UI shows 0 influence/resources for non-active players (misleading).

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/index.ts`
  * Modify `isZoneVisible` so that `PersonalSupply:<pid>` zones are visible to all players.
  * Keep current masking for:
    * `DrawPile`
    * `staging_<pid>`
    * `PlayerHand:<pid>`
  * Ensure `engine.pendingChoice` masking policy remains unchanged.

### 5.2 Tests

* Update/Add:
  * `packages/game/test/player-view-visibility.test.ts` (new)
    * Create a minimal `G` with multiple PersonalSupply zones containing resources/influence.
    * Assert `buildPlayerView(G, '0')` includes `PersonalSupply:1` items after this change.
    * Assert `DrawPile` remains masked (placeholders) and staging/hand remain private.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-information-visibility.md` created (required if visibility policy is not currently documented)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

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

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Adjust `isZoneVisible` to return `true` for any `PersonalSupply:<pid>`.
* [ ] Keep existing visibility rules for `staging_` and `PlayerHand:`.
* [ ] Ensure DrawPile still returns placeholders.
* [ ] Add `player-view-visibility` test coverage.
* [ ] If visibility policy is undocumented, add a DD doc describing what is public vs private.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] When viewing as player 0, player 1’s PersonalSupply counts are non-zero and match the authoritative state.
* [ ] DrawPile remains masked (no tile IDs leaked).
* [ ] Staging and PlayerHand remain private to the owning player.
* [ ] Golden replay unchanged or updated intentionally with explanation.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* <what changed>
* <why>

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → <ok/fail + details>
* `pnpm test` → <ok/fail + details>
* (optional) `pnpm vitest run <pattern>` → <ok/fail + details>

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
