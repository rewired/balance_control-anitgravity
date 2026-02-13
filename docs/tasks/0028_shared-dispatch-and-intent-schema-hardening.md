# Codex Task 0028 — Intent Schema Hardening + Shared Dispatcher (UI + Bot)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* No drift: AGENTS 0.1, 0.5, 0.6
* Move payload schemas: Task 0004
* No implicit effects: CORE-01-10 

---

## Goal

Make the "legal intent" interface robust enough that **UI** and future **bots** can share:

1) a validated, versioned intent schema, and  
2) a small dispatcher helper that maps an `Intent` to a `moves.*` call.

No gameplay changes.

---

## Inputs

* Task 0026: `Intent` types and `enumerateLegalIntents`
* Task 0027: client uses intents for UI
* Existing Zod schemas for moves (Task 0004 outputs)

---

## Outputs

### A) Zod schema for intents (game package)

Add `packages/game/src/ui/intentSchema.ts`:

- `IntentSchema` (zod discriminated union)
- `IntentListSchema` (array)
- Optional: `IntentEnvelope` with `version: 1`

Rules:
- Schema must be JSON-safe
- Keep it minimal; only include kinds actually emitted by enumeration.

### B) Shared dispatcher helper (UI + bot)

Add a pure helper:

Option 1 (recommended): `packages/shared/src/intents/dispatch.ts`  
Option 2: `packages/client-web/src/ui/dispatchIntent.ts`

Signature (example):

```ts
export function dispatchIntent(
  intent: Intent,
  moves: any,
  ui?: { selection?: any }
): void;
```

Rules:
- It must only translate intent -> move invocation.
- No legality logic.
- No branching on stage beyond the intent kind.

### C) Runtime assertions (dev-only)

In dev builds (or tests), validate:
- `IntentListSchema.parse(enumerateLegalIntents(...))` passes.
This catches accidental non-serializable payloads early.

### D) Tests

- Unit tests for schema parsing and dispatcher mapping.

---

## Constraints

* No new intent kinds unless already emitted by enumeration.
* No move behavior changes.
* Keep dispatcher side-effect free beyond calling provided move function.

---

## Invariants

* UI, bots, and tests can depend on the same `Intent` schema.
* Intent ordering stays deterministic.

---

## Acceptance Criteria

1. Intent schema exists and validates current enumeration output.
2. Dispatcher exists and is used by client (or at least covered by tests).
3. `pnpm -w test` green.

---

## PR Checklist

* [ ] Add Zod schema for intents
* [ ] Add shared dispatcher helper
* [ ] Add tests (schema + dispatcher)
* [ ] Wire validation in dev/test
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0028)
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green
