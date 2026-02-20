# Task 0100 — Match Pack Locking + Public Surface Hash (Replay Safety)

**Date:** 2026-02-17
**Owner:** Codex
**Branch:** `task/0100-match-pack-lock-surface-hash`

---

**Task State:** COMMIT_READY

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
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-001: Match meta stores canonical enabled pack manifests and surface hash; no client-side rule logic added.
* GR-003: Public surface hash uses canonical JSON + sorted identifiers; no non-deterministic inputs.
* GR-012: Match config remains the canonical source for enabled packs; hash is derived from config-assembled packs.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:STATE AUTHORITY, ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Lock enabled pack manifests in match meta at setup.
* Compute and persist a deterministic public surface hash.
* Reject replays when surface hashes do not match.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No rule logic changes or move behavior changes.
* No new expansions or pack definitions added.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/game/src/setup.ts`
  * `packages/game/src/surface.ts`
  * `packages/game/src/replay.ts`
  * `packages/client-web/src/App.tsx`
  * `packages/rules/src/index.ts`
* Existing behavior summary (current):

  * Match meta does not include locked pack manifests or surface hashes.
  * Replay loader does not validate surface mismatches.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/game/src/setup.ts`
* `packages/game/src/surface.ts`
* `packages/game/src/replay.ts`
* `packages/game/src/index.ts`
* `packages/client-web/src/App.tsx`
* `packages/rules/src/index.ts`

### 5.2 Tests

* `packages/game/test/surface-hash.test.ts`
* `packages/game/test/replay-runner.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Compute public surface + hash from enabled packs.
* [x] Persist enabled pack manifests and hash in setup meta.
* [x] Validate surface mismatch during replay load and runtime.
* [x] Update replay payload to include surface hash.
* [x] Add unit tests for hash stability and mismatch handling.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Starting a match writes `enabledPacks` and `publicSurfaceHash` into state.
* [x] Unit tests cover stable hash and mismatch.
* [x] Replay mismatch fails fast with a clear error.

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

* Locked enabled pack manifests and public surface hash in match meta.
* Added runtime and replay surface hash validation.
* Extended replay payload to include surface hash.
* Added surface hash tests and updated golden replay hashes.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm test` → ok
* `pnpm lint` → ok (TypeScript version warning)

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

Pending (no commit created).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Pending (no commit created).

---

## 15) Amendments (append-only)

### A-01 — Retroactive task freeze

* Reason: Task execution started before the task file was upgraded to the required template.
* Change: Sections 0–9 were filled retroactively to align with the non-negotiable task format.
* Spec anchors: ARCH-01:STATE AUTHORITY, ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION
* Guardrails: GR-001, GR-003, GR-012
