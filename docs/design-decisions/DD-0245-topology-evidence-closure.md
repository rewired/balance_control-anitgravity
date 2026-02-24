# DD-0245 — Topology Evidence Closure

- **Date:** 2026-02-24
- **Task:** 0245
- **Status:** Accepted

## Context

CORE topology obligations were already behaviorally covered, but some obligations were linked to broad invariant suites instead of direct, named topology assertions.

## Decision

1. Add explicit topology tests that directly assert:
   - Board position binding uniqueness.
   - `placeTile` legal-intent adjacency coordinate constraints.
2. Update `CORE-01-OBLIGATIONS.json` evidence links for topology cluster items so the registry points at direct executable proof.

## Consequences

- Evidence quality improves from indirect to direct assertion-level mapping for key topology obligations.
- Runtime engine behavior remains unchanged; this is a test/docs hardening change only.
