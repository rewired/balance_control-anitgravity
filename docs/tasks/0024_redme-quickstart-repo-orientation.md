# Codex Task 0024 — README Quickstart + Repo Orientation

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Determinism: AGENTS 0.2
* Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Goal

Add a public-facing `README.md` that makes the repo runnable and understandable in under 5 minutes.

The README must not invent rules or mechanics. It only documents what is already implemented.

---

## Inputs

* Existing repo structure:

  * `docs/rules/*` (normative specs)
  * `docs/tasks/*` (Codex contracts)
  * `packages/game/*` (engine + tests)
  * `packages/expansion-01/02/03/*` (expansions)
* Existing scripts in `package.json` (workspace root)
* Golden replay / hashing tests under `packages/game/test/*`

---

## Outputs

### A) New/updated README

Create (or replace if minimal placeholder exists):

* `README.md`

README must include:

1. **Project summary**

* What BALANCE // CONTROL (software edition) is.
* What this repo contains (rules + deterministic implementation).

2. **Requirements**

* Node version expectation (explicit)
* pnpm requirement (explicit)

3. **Quickstart**

* `pnpm -w install`
* `pnpm -w test`
* Optional:

  * `pnpm -w lint`
  * `pnpm -w build`

4. **Repo map**

* `docs/rules/` as normative source of truth
* `packages/game/` as canonical engine implementation
* `packages/expansion-01|02|03/` as modular expansion packages
* Where tasks live (`docs/tasks/`) and how they relate to changes

5. **Determinism & golden replays**

* A short explanation of why determinism matters here
* Where golden fixtures live
* How to run them (usually covered by `pnpm -w test`)

6. **Contributing / PR expectations (short)**

* “No rules drift” principle
* Mention that CI must be green

Optional (nice-to-have):

* Add a CI badge once Task 0023 is merged.

### B) Minimal doc/task bookkeeping

* Add `docs/tasks/0024_readme-quickstart.md` containing this contract + checklist.
* Update `docs/PR_TASK_LIST.md` to include Task 0024.
* Update `CHANGELOG.md` under **Unreleased**:

  * “Docs: Added README quickstart and repo orientation.”

---

## Constraints

* No new mechanics.
* Do not paraphrase or reinterpret rules; only point to `docs/rules/*`.
* Keep README concise; prefer links/paths over long prose.
* ASCII only in anchors/paths to avoid encoding drift.

---

## Invariants

* `docs/rules/*` remains the source of truth.
* README instructions must match actual scripts and commands.

---

## Acceptance Criteria

1. A newcomer can clone the repo and run tests successfully using README steps.
2. README correctly describes repo structure and where rules/specs live.
3. README does not introduce any new rule text.
4. Docs bookkeeping updated (task file + PR list + changelog).

---

## PR Checklist

* [ ] Added/updated `README.md` with: requirements, quickstart, repo map, determinism notes
* [ ] Verified commands work on a clean clone
* [ ] Kept README strictly descriptive (no new mechanics)
* [ ] `pnpm -w test` passes
* [ ] Updated `CHANGELOG.md` (Unreleased)
* [ ] Updated `docs/PR_TASK_LIST.md`
* [ ] Added `docs/tasks/0024_readme-quickstart.md` and completed checklist after implementation
