# Task 0191 — CORE: Hotspot “prohibited” still marks resolved (single-resolution invariant)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0191-core-hotspot-prohibited-still-resolves-once`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-007

### compliance_notes
* GR-007: Align hotspot resolution order with spec: prohibition skips placement but still performs the explicit permitted mutation (resolved mark).

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-06-03B (Hotspot resolves at most once; after a resolution attempt—even if prohibited—mark resolved)
* CORE-01-06-04(c) (If prohibited, skip (d) but still mark resolved)

---

## 2) Goal

* Ensure a hotspot cannot “come back later” when a temporary prohibition was active at first enclosure.
* Preserve the explicit spec exception: resolved-marking is permitted even when no Influence is placed.

---

## 3) Non-Goals

* No change to how majority is computed.
* No change to whether influence is placed when supply is empty.
* No changes to prohibition evaluation rules beyond honoring the resolved-mark requirement.

---

## 4) Inputs

* Hotspot atom:
  * `packages/game/src/engine/atoms/hotspot.ts`
* Existing hotspot tests:
  * `packages/game/test/hotspot.test.ts`

---

## 5) Outputs

### 5.1 Code

* Update `handleHotspotResolve` to:
  * detect “already resolved” first (unchanged)
  * compute prohibition, but **always** record resolved mark for the tile after the attempt
  * if prohibited: do **not** enqueue influence.place

File:
* `packages/game/src/engine/atoms/hotspot.ts`

### 5.2 Tests

* Add a regression test that fails on current behavior:
  * First resolve attempt with prohibition set → no influence placed, but tile is marked resolved.
  * Second resolve attempt after clearing prohibition → still does nothing (because already resolved).

Suggested location:
* extend `packages/game/test/hotspot.test.ts`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated.
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Must not mark resolved twice.
* Must not place Influence if prohibited.
* Determinism preserved; no RNG.

---

## 7) Invariants (Must remain true)

* A hotspot resolves at most once per tile ID.

---

## 8) Implementation Plan

* [ ] Step 1: Refactor `handleHotspotResolve` to ensure the resolved mark is written even when prohibited.
* [ ] Step 2: Add regression test (two resolution attempts, prohibition toggled).
* [ ] Step 3: Run `pnpm test`.

---

## 9) Acceptance Criteria

* [ ] With prohibition active: hotspot is marked resolved and will not resolve again.
* [ ] With prohibition cleared after the first attempt: a second attempt still does nothing.
* [ ] All tests pass.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately.
* [ ] Normative anchors cited.
* [ ] `pnpm test` passes.
* [ ] Working tree clean after postflight amend.
