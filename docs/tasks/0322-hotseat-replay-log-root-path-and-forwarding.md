# Task 0322 — Hotseat replay log root path and forwarding

**Date:** 2026-03-03
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* GR-002
* GR-003

### compliance_notes (required if affected_guardrails != NONE)

* GR-002 respected: replay forwarding/logging remains infrastructure-only; no client legality/cost/majority logic introduced.
* GR-003 respected: replay side effects are best-effort logging only and do not mutate deterministic engine state transitions.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (infrastructure logging only)
* ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

* Store default replay logs in repo-root `log/replay`.
* Ensure hotseat mode also produces replay log files via server sink.

## 3) Non-Goals

* No rule/move/resolver behavior changes.
* No replay format changes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism preserved
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated

## 11) Work Summary

* Changed replay default directory resolution to workspace-root `log/replay`.
* Added hotseat replay ingest endpoint on server (`POST /api/replay/hotseat`).
* Shared a single server replay sink between multiplayer hooks and hotseat ingest.
* Added client hotseat replay forwarding sink (`sendBeacon`/`fetch` best-effort).
* Updated changelog and added DD-0322.

## 12) Commands Run

* `pnpm -w lint` → ok
* `pnpm -w test` → ok

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same Postflight block.
