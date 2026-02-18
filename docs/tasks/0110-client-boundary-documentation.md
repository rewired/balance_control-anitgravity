# Codex Task 0110 - Client Boundary Documentation (ARCH-01 Presentation-Only)

**Date:** 2026-02-17
**Style:** Codex task contract
**Primary contract:** AGENTS.md (repo root)

---

## Goal

Make the engine/client boundary unmissable in the client code via TSDoc.

Any client module that reads G/ctx, renders rule-relevant state, or triggers intents MUST document:
- presentation-only
- no legality/cost/majority computation in client
- reference ARCH-01 explicitly

No behavior changes.

---

## Inputs

- /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- /docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md
- packages/client-web source tree

---

## Outputs

Add TSDoc to relevant client modules (components + helpers) that:
- consume G/ctx/playerView
- render board state and tile UI
- trigger moves/intents

Each must include @remarks containing:
- "Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01)."

Where helpful, include @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md.

---

## Constraints

- No new rule logic in client.
- No move legality computation added.
- No engine logic duplicated.

---

## Invariants

- Client remains presentation-only (ARCH-01).
- Determinism remains engine-bound.

---

## Acceptance Criteria

- All state-reading / rule-adjacent client modules include TSDoc boundary notes.
- No behavior changes; build/tests pass.

---

## PR Checklist

- [ ] Client boundary documented in relevant modules
- [ ] No legality logic added
- [ ] No engine changes
- [ ] CI/tests pass
- [ ] Meaningful commit message
