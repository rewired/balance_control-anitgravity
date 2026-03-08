# Task 0342 — Replay expansion metadata capture sentinel handling

**Date:** 2026-03-08
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0342-replay-expansion-metadata-capture`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-003
* GR-012

### compliance_notes

* GR-003: Replay header metadata capture remains deterministic; expansion normalization is still canonical and stable-sort based.
* GR-012: Match configuration remains authoritative from record metadata; this task only changes when optional expansion echoes are captured, not expansion enablement authority.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC present, DD present, TDD present, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (infrastructure replay logging only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM, ARCH-02:SERIALIZATION
* FORMAT: `/docs/replay-format-v1.md` §3.1 (header), §3.2 (action metadata echo)

## 2) Goal

* Keep replay stream `expansions` metadata unset (`undefined`) until a record actually provides an expansion array.
* Prevent premature defaulting in `ensureStream` that can block later valid metadata capture.
* Ensure header normalization/output responsibility remains centralized in `ensureHeader`.
* Add regression coverage for late-arriving expansion metadata capture before header emission.

## 3) Non-Goals

* No replay file format schema changes.
* No changes to replay verifier behavior.
* No changes to filename derivation, checkpoint cadence, or footer semantics.

## 4) Inputs

* Repo areas:
  * `packages/server/src/replay-logging.ts`
  * `packages/server/src/replay-logging.test.ts`
* Existing behavior summary (current):
  * `ensureStream` eagerly normalized missing `record.expansions` to `[]`, which could be treated as already-set metadata in subsequent capture checks.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (server replay logging + tests only; no UI/prozess scope).

## 5) Outputs

### 5.1 Code

* `packages/server/src/replay-logging.ts`

### 5.2 Tests

* `packages/server/src/replay-logging.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [x] `/docs/design-decisions/DD-0342-replay-expansion-metadata-capture.md` created (architectural metadata-capture behavior documentation)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not required; no normative rule text clarification)

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:
  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

## 8) Implementation Plan

* [x] Step 1: Update `ensureStream` expansion initialization to preserve `undefined` unless `record.expansions` is an array.
* [x] Step 2: Tighten `captureHeaderMetadata` unset detection to use an explicit `undefined` guard.
* [x] Step 3: Keep normalization/output in `ensureHeader` and add regression tests for late expansion metadata capture flow.
* [x] Step 4: Update changelog + DD/task artifacts.

## 9) Acceptance Criteria

* [x] `StreamState.expansions` remains unset until valid array metadata appears.
* [x] `ensureStream` no longer normalizes undefined expansion metadata to `[]`.
* [x] `captureHeaderMetadata` sets expansions exactly once from first valid array when still unset.
* [x] Replay logging tests cover first-record-missing-expansions then later-record-provides-expansions flow.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (targeted replay sink/verifier tests pass)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Switched server replay stream metadata handling so `expansions` stays `undefined` until a record explicitly provides an array.
* Updated stream initialization to avoid eager normalization of absent expansion metadata.
* Hardened metadata capture guard to detect only true “unset” state (`undefined`) before accepting first valid expansion array.
* Preserved normalization responsibility in `ensureHeader` at header emit time.
* Added regression test that simulates missing expansions first, then valid later expansions before header emission.
* Updated changelog, DD, and task artifact per repo governance.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/rules build` → OK
* `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → OK
* `pnpm -C packages/server test` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (no UI/prozess scope).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight: block with `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
