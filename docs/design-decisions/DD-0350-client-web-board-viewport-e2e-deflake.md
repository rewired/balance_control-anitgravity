# DD-0350 — Client-web viewport interaction hardening for deterministic E2E zoom assertions

- **Date:** 2026-03-09
- **Status:** Accepted
- **Related Task:** `docs/tasks/0350-client-web-board-viewport-e2e-deflake.md`

## Context

`e2e/client-web/board-viewport.spec.ts` exhibited intermittent zoom flakes around wheel interaction timing and clamp boundaries. The viewport uses `react-zoom-pan-pinch`, with fit/reset baseline tracking through data attributes.

## Decision

1. Keep zoom/pan/pinch behavior owned by `BoardViewport` and `react-zoom-pan-pinch`, but harden fit/reset no-op behavior to avoid redundant transform writes when target equals current transform.
2. Clamp computed fit scale to the same min/max contract as runtime zoom (`0.25..2.5`) to keep baseline and interaction assertions aligned.
3. Add non-passive gesture listeners on the viewport root to explicitly `preventDefault` on gesture events (`gesturestart/change/end`) and avoid browser-native pinch interference where these events are present.
4. Refactor E2E zoom waiting to explicit scale-delta polling (`waitForScaleDelta`) and choose a zoom-out baseline that is first moved away from minimum-scale clamp.

## Consequences

- E2E is less sensitive to race conditions and clamp-edge starts.
- Pan/reset assertions no longer depend on a potentially clamped initial zoom-out.
- UI remains presentation-only; no engine/rules behavior changes.
