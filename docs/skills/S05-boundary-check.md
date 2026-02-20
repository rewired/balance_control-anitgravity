# S05 — Engine/Client Boundary Check

## Purpose
Stop rule logic from leaking into the client and keep legality authoritative.

## Use when
- UI changes that “compute” something
- Adding selectors or helpers in client code
- Bot logic changes

## Inputs
- Any code path that could influence move legality, costs, majority, modifiers

## Output
- Clear separation:
  - engine computes legality via `enumerateLegalIntents`
  - client only renders and requests previews

## Steps
1. **Search for suspicious client logic**
   - `rg -n "majority|cost|modifier|legal|enumerate|resolve" packages/client* packages/shared`
2. **If found**
   - Move that logic into `packages/game` (engine), expose via selectors or intent enumeration.
3. **Bot constraint**
   - Bot must choose only from enumerated intents, never “invent” a move.
4. **Document**
   - Add a one-liner in TSDoc: “presentation-only; no rule logic”.

## Guardrails
- Client may not compute legality, costs, majority, or modifiers.
- If the UI needs a preview, it asks the server/engine for a computed preview result.
