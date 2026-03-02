# DD-0310 — Config Contract v1 (`logging.replay`) rationale

- **Status:** Accepted
- **Date:** 2026-02-26
- **Deciders:** Maintainers
- **Related artifacts:** `docs/logging-config-v1.md`, `docs/design-decisions/DD-0306-logging-config-spec-v1.md`, `docs/design-decisions/DD-0307-logging-config-source-precedence.md`, `docs/design-decisions/DD-0308-replay-directory-default-and-filename-convention.md`, `docs/design-decisions/DD-0309-config-version-and-reserved-root-namespaces.md`

## Context

Task 03xx introduced the first stable logging configuration contract for replay export. The contract needed explicit decisions to avoid namespace drift, parser ambiguity, and environment-specific filesystem failures.

This DD records the rationale behind the v1 choices that are normative for `logging.replay`.

## Decision

### 1) Namespace choice: `logging.replay` (not `replay` / `logging-replay`)

We standardize replay settings under `logging.replay`.

**Rationale:**

- Keeps replay as a sub-domain of logging rather than a peer root concern, leaving root-level namespace for runtime domains (`server`, `client`, `matchmaking`, `bot`, `logging`).
- Avoids top-level key proliferation (`replay`) and delimiter-variant drift (`logging-replay`) across JSON, CLI, and ENV mapping.
- Preserves forward-compatible grouping: future logging facets (`logging.console`, `logging.file`, `logging.redaction`) can evolve in one stable subtree.

### 2) Replay v1 wire format: NDJSON

Replay v1 format is fixed to `ndjson`.

**Rationale:**

- Deterministic append model: one event per line is stable for streaming, rotation, truncation recovery, and line-by-line tooling.
- Operational simplicity: plain-text transport, low-friction diffing, and compatibility with existing JSON line processors.
- Contract minimization for v1: a single canonical format avoids multi-format parser divergence and reduces implementation risk.

### 3) Configurable replay directory + safety boundaries

`logging.replay.directory` remains runtime-configurable with default `./log/replays`.

**Rationale:**

- Different execution contexts (local dev, CI, containerized server) require writable paths that are deployment-specific.
- A fixed hard-coded path is brittle across environments and increases startup failure risk.
- Defaulting to `./log/replays` provides a predictable baseline while preserving operator control.

**Safety boundaries (v1 policy):**

- Replay output path should target writable runtime storage only.
- Replay output path should **not** target source/documentation trees (`packages/`, `docs/`).
- Replay artifacts are treated as runtime byproducts and are ignored in VCS (`var/replays/**`, `*.replay.ndjson`).

### 4) Override precedence: `CLI > ENV > conf.json > Default`

Final effective config is resolved with strict precedence:

1. CLI flags
2. Environment variables
3. `conf.json`
4. Internal defaults

**Rationale:**

- Mirrors standard operator expectations: explicit process-local overrides win.
- Enables deterministic emergency overrides in production without mutating persisted config.
- Keeps repository-level baseline in `conf.json` while supporting ephemeral environment overlays.
- Ensures a single canonical merge order, preventing source-order nondeterminism.

## Consequences

### Positive

- Stable namespace and source mapping across JSON/ENV/CLI.
- Lower ambiguity for future config evolution.
- Safer operational behavior for replay file placement.
- Deterministic config resolution semantics.

### Trade-offs

- v1 intentionally does not permit alternate replay formats.
- Consumers must respect typed validation and fail-fast behavior for invalid known values.

## Compatibility and migration notes

- Existing/legacy inputs without `configVersion` remain supported via v0→v1 migration gate.
- Future format expansion requires explicit versioned contract updates (new DD + config spec revision).
