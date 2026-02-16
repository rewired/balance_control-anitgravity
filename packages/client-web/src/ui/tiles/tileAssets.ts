import overlayUrl from "../../assets/tiles/tile-overlay.png";
import baseTileUrl from "../../assets/tiles/base_tile.svg";

import domIconUrl from "../../assets/tile-icons/dom.svg";
import infIconUrl from "../../assets/tile-icons/inf.svg";
import forIconUrl from "../../assets/tile-icons/for.svg";

import ecoIconUrl from "../../assets/tile-icons/eco.svg";
import secIconUrl from "../../assets/tile-icons/sec.svg";
import clmIconUrl from "../../assets/tile-icons/clm.svg";
import nrgIconUrl from "../../assets/tile-icons/nrg.svg";

export const tileOverlayUrl = overlayUrl;
export const baseTileSvgUrl = baseTileUrl;

export const tileIconUrlByCode = {
  DOM: domIconUrl,
  INF: infIconUrl,
  FOR: forIconUrl,
  ECO: ecoIconUrl,
  SEC: secIconUrl,
  CLM: clmIconUrl,
  NRG: nrgIconUrl,
} as const;

export type TileIconCode = keyof typeof tileIconUrlByCode;

export const resortIconUrlByResort = {
  DOM: domIconUrl,
  INF: infIconUrl,
  FOR: forIconUrl,
} as const;

export type ResortKey = keyof typeof resortIconUrlByResort;
