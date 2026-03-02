# DD-0317 — Bot-LLM Transport Layer and Deterministic Fallback

## Status
Accepted

## Context
Task 0317 introduces outbound HTTP integration for the LLM bot (`packages/bot-llm`) while preserving ARCH-04 constraints:
- legal moves must remain engine-enumerated;
- the LLM must select by index only;
- failures must resolve to deterministic fallback behavior.

The existing adapter already validated `{ selectedIndex }` via `parseLLMSelection` / `LLMSelectionSchema`, but had no dedicated network transport abstraction.

## Decision
We introduce a dedicated transport module `packages/bot-llm/src/ollama-client.ts` with `requestOllamaSelection(...)` that:
1. Reads endpoint/model/timeout from explicit bot config input.
2. Builds a deterministic, index-only prompt from legal move options.
3. Calls Ollama `/api/generate` with strict JSON output constraints.
4. Returns the raw response string only.

Validation remains centralized in `adapter.ts` via existing `parseLLMSelection` / `LLMSelectionSchema`.

A new adapter entrypoint `selectIntentWithOllama(...)` orchestrates:
- deterministic legal-move snapshot,
- transport request,
- schema validation + stale/index checks,
- deterministic fallback to index `0` on timeout/network/transport errors.

## Consequences
- Positive: clear separation between transport I/O and deterministic selection logic.
- Positive: testability improves via injectable HTTP client and isolated failure-mode testing.
- Positive: ARCH-04 compliance is preserved (no free move construction; index-only).
- Tradeoff: bot result reasons now include `transport-error` for observability of network failures.

## Compliance Anchors
- ARCH-04:INTERACTION_MODEL
- ARCH-04:RESTRICTIONS
- ARCH-04:DETERMINISM
- GR-005 (No Phantom Moves)
- GR-013 (Bot Contract)
