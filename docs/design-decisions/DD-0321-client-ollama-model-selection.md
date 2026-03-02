# DD-0321 — Client Ollama model selection and seat-config validation

- **Date:** 2026-03-02
- **Status:** Accepted
- **Related task:** 0321

## Context

The client previously accepted free-text Ollama model names for bot seats. This allowed typoed or stale models to flow into setupData and fail later during bot execution.

## Decision

1. Add a small client API layer for `GET /api/tags` (default `http://localhost:11434/api/tags`) with deterministic timeout/error handling.
2. Replace free-text model inputs in start/lobby screens with model `<select>` controls bound to loaded model names.
3. For bot seat modes (`human-vs-ai`, `ai-vs-ai`), disable match-start actions while model selection is invalid.
4. Enforce seat-config validation in `buildSeatConfig`/`buildValidatedSetupData`: bot modes must select a model that exists in the loaded model list.

## Consequences

- Invalid model strings are rejected early and deterministically on the client.
- UX clearly communicates model-loading failures and provides a refresh action.
- Human-vs-human flow remains unaffected by model availability.
