# Codex Task 0070 - Centralize tile asset paths + icon mapping (single import surface)

**Date:** 2026-02-16
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS
- State shape consistency: ARCH-02
- Use NPM solutions where useful: AGENTS

---

## Goal

Prevent asset path drift by creating a **single import surface** for:

1) `tile-overlay.png` (glass overlay)
2) `base_tile.svg` (canonical tile SVG template, if ever needed by UI code)
3) Tile icons as SVG assets (DOM/INF/FOR and expansion icons if present)

All tile rendering code MUST import from this module instead of importing assets directly.

---

## Inputs

Existing assets (already in repo):

- `packages/client-web/src/assets/tiles/base_tile.svg`
- `packages/client-web/src/assets/tiles/tile-overlay.png`
- `packages/client-web/src/assets/tile-icons/*.svg` (dom/inf/for/eco/sec/clm/nrg, etc.)

Existing code likely importing overlay directly:

- `packages/client-web/src/ui/tiles/GlassOverlay.tsx`
- possibly other UI/dev code

---

## Outputs

### A) New centralized module

Create:

- `packages/client-web/src/ui/tiles/tileAssets.ts`

It MUST:

1) Import assets exactly once (Vite URL imports):

```ts
import overlayUrl from "../../assets/tiles/tile-overlay.png";
import baseTileUrl from "../../assets/tiles/base_tile.svg";

import domIconUrl from "../../assets/tile-icons/dom.svg";
import infIconUrl from "../../assets/tile-icons/inf.svg";
import forIconUrl from "../../assets/tile-icons/for.svg";

// optional: if these exist in repo
import ecoIconUrl from "../../assets/tile-icons/eco.svg";
import secIconUrl from "../../assets/tile-icons/sec.svg";
import clmIconUrl from "../../assets/tile-icons/clm.svg";
import nrgIconUrl from "../../assets/tile-icons/nrg.svg";
