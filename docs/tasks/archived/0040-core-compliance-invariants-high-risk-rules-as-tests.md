# Codex Task 0040 — CORE-01 Compliance Invariants (High-Risk Rules as Tests)

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Canonical effect resolver: AGENTS 3.5
- Production order: AGENTS 3.6
- Start Committee immunity: AGENTS 3.7
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Convert the most failure-prone CORE rules into hard tests (unit + golden).
Focus on rules that are often implemented "almost right".

## Inputs (rule anchors)
- CORE-01 Zone/State model sections
- Start Committee restrictions + immunity
- ConvertResources legality + repeat-penalty rules
- Ping-pong production reduction rules
- Influence hard cap rules
- ADD56-01 overrides where relevant

## Outputs
Add/extend tests covering at least the following invariant families:

### 1) Zone Exclusivity
- Every object exists in exactly one zone at all times.
- No duplicates across zones.
- Removal/movement preserves this invariant after every move/effect.

### 2) Start Committee Hard Gates
- Influence cannot be placed or moved onto Start Committee.
- Start Committee cannot be controlled.
- Start Committee is immune to effects (as specified).
- IMPORTANT: if any non-Influence markers are allowed there by spec, do not over-forbid.

### 3) ConvertResources Legality + Repeat Penalty
- Convert is legal only if at least one controlled Grassroots exists.
- Repeat penalty applies based on "repeating Convert within a turn" rules:
  - must match CORE wording (and any streamlined updates in v1.1.0)
- Repeat penalty must apply regardless of which controlled Grassroots the marker stands on.

### 4) Ping-Pong Production Reduction
- When in ping-pong state/mode, production is reduced to 50% rounded down.
- Respect any caps explicitly defined in CORE (e.g., max 10 after reduction, if specified).

### 5) Influence Cap
- Hard cap enforced per player.
- If ADD56-01 changes caps for 5-6 players, add test cases for those configs.

### 6) Canonical Production/Resolution Order
- At end-of-round production (and other multi-step resolution) must follow canonical order exactly.
- Add at least one golden replay that exercises:
  - a Hotspot/trigger chain (if applicable)
  - convert-repeat penalty
  - ping-pong reduction

## Constraints
- No new mechanics. Only enforce what the rules specify.
- Tests must be deterministic: fixed seeds, stable IDs, stable hashes.
- Prefer minimal fixtures: one test = one rule family.

## Invariants
- Engine authority and determinism are non-negotiable.

## Acceptance
- pnpm -r test passes.
- At least one new golden replay fixture added that covers:
  - start-committee gate edge case
  - convert-repeat penalty edge case

## PR Checklist
- [x] Invariant tests added
- [x] Golden fixtures added/updated
- [x] Changelog updated
- [x] CI green

## Work Summary
- Added invariant coverage for zone exclusivity, Start Committee gating, influence caps, and convert repeat penalties.
- Added PingPong production reduction tests and golden replay coverage for hotspot/convert flows.
- Recorded CORE compliance coverage updates alongside existing v1.1.0 ruleset alignment.

## Commands Run
- `pnpm lint`
  ```text
  > balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
  > eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"

  =============

  WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

  You may find that it works just fine, or you may not.

  SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

  YOUR TYPESCRIPT VERSION: 5.9.3

  Please only submit bug reports when using the officially supported version.

  =============
  ```
- `pnpm test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test

  Scope: 9 of 10 workspace projects
  [54 lines collapsed]
  │  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 5ms
  │ stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inn…
  │ Expansion registered: EXP-02 Security & Order
  │ EXP-02 Setup Complete.
  │  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 4ms
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  │  Test Files  20 passed (20)
  │       Tests  81 passed (81)
  │    Start at  18:14:38
  │    Duration  25.89s (transform 5.71s, setup 2ms, collect 45.16s, tests 1.36s, environment 4ms, prepare 51.89s)
  └─ Done in 28.2s
  packages/client-web test$ vitest run
  │  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  │  ✓ test/Board.test.tsx  (1 test) 3ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 20ms
  │  Test Files  2 passed (2)
  │       Tests  2 passed (2)
  │    Start at  18:15:07
  │    Duration  21.26s (transform 83ms, setup 0ms, collect 1.49s, tests 23ms, environment 12.24s, prepare 1.68s)
  └─ Done in 23.7s
  ```
- `git status`
  ```text
  nothing to commit, working tree clean
  ```
- `git diff --stat`
  ```text
  ```
- `git show -1 --stat`
  ```text
  Author: Björn Ahlers <rewired.de@gmail.com>
  Date:   Sat Feb 14 18:55:03 2026 +0100

      task(0040): finalize compliance task records

      - mark task 0040 complete in task list

      - refresh checklist, commands, and postflight proof

   docs/PR_TASK_LIST.md                               |   2 +-
   ...mpliance-invariants-high-risk-rules-as-tests.md | 100 +++++++++++++++------
   2 files changed, 73 insertions(+), 29 deletions(-)
  ```

## Postflight Proof

### git status
```
nothing to commit, working tree clean
```

### git diff --stat
```
```

### pnpm test
```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
[54 lines collapsed]
│  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 4ms
│ stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner …
│ Expansion registered: EXP-02 Security & Order
│ EXP-02 Setup Complete.
│  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 5ms
│  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
│  Test Files  20 passed (20)
│       Tests  81 passed (81)
│    Start at  16:23:40
│    Duration  26.09s (transform 5.56s, setup 2ms, collect 44.20s, tests 1.51s, environment 4ms, prepare 53.05s)
└─ Done in 28.4s
packages/client-web test$ vitest run
│  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
│  ✓ test/Board.test.tsx  (1 test) 3ms
│  ✓ test/controls-start-committee.test.tsx  (1 test) 20ms
│  Test Files  2 passed (2)
│       Tests  2 passed (2)
│    Start at  16:24:08
│    Duration  21.49s (transform 127ms, setup 0ms, collect 1.53s, tests 23ms, environment 12.45s, prepare 1.81s)
└─ Done in 24s
```
