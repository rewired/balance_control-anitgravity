# Codex Task 0023 — GitHub Actions CI (pnpm workspace)

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Tests + golden replays + hashing: AGENTS 5.1–5.3

---

## Goal

Add a GitHub Actions workflow that runs the repo’s deterministic checks on every PR and push.

This task turns “tests are green locally” into “tests are green in the public repo, always”.

---

## Inputs

* `pnpm-lock.yaml`
* Workspace layout (`packages/*`, `docs/*`)
* Existing scripts in `package.json` / workspace packages:

  * `pnpm -w test`
  * (optional) `pnpm -w lint`, `pnpm -w build`
* Node/pnpm expectations (as currently used locally)

---

## Outputs

### A) Workflow file

Create:

* `.github/workflows/ci.yml`

Workflow requirements:

* Trigger on:

  * `pull_request`
  * `push` to `main` (and optionally `develop` if present)
* Use a single job `ci` on `ubuntu-latest`.
* Use caching for pnpm store.
* Install with lockfile enforcement.
* Run tests deterministically.

Suggested steps (adapt to repo conventions):

1. `actions/checkout@v4`
2. Setup Node (LTS) via `actions/setup-node@v4` (pin a major; prefer explicit Node version)
3. Enable `corepack` and activate pnpm (or use `pnpm/action-setup`)
4. Cache pnpm store (`pnpm store path`)
5. `pnpm -w install --frozen-lockfile`
6. `pnpm -w test`
7. Optional but recommended:

   * `pnpm -w lint`
   * `pnpm -w build`

### B) Developer-facing guardrails

* Ensure CI fails if:

  * lockfile is out of sync
  * tests are flaky
  * determinism policy tests fail

---

## Constraints

* No change to game rules or runtime behavior.
* No network calls beyond dependency install.
* Deterministic execution: no time-based steps or unstable ordering.
* Keep the workflow minimal: one job, no matrix unless required.

---

## Invariants

* `pnpm -w test` must be the authoritative gate for correctness.
* CI must match local behavior as closely as possible.

---

## Acceptance Criteria

1. CI runs on PRs and pushes to `main`.
2. CI installs dependencies with `--frozen-lockfile`.
3. CI runs `pnpm -w test` and reports status.
4. CI uses caching (pnpm store) to avoid redundant installs.
5. A fresh clone + CI run succeeds without manual steps.

---

## PR Checklist

* [x] Added `.github/workflows/ci.yml`
* [x] CI triggers on PR + push to `main`
* [x] Uses pnpm with lockfile enforcement (`--frozen-lockfile`)
* [x] Runs `pnpm -w test`
* [x] pnpm store caching enabled
* [x] Verified CI run is green on a test PR
* [x] Updated `docs/PR_TASK_LIST.md` with Task 0023
* [x] Added `docs/tasks/0023_github-actions-ci.md` and completed checklist after implementation

---

## Notes (manual repo setting)

After merging, enable branch protection in GitHub:

* Require status checks: the `ci` workflow
* Require branches to be up to date before merging
