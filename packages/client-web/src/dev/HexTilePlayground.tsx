import React, { useMemo, useState } from "react";

import { HexTileVisual } from "../ui/tiles/HexTileVisual";
import { seatColor } from "../ui/tiles/seatColor";
import type { SeatId, TileBadge } from "../ui/tiles/types";

const DEFAULT_TILE_H = 240;
const TILE_ASPECT = 747 / 864;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function IconBolt() {
  return (
    <path
      d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
      fill="currentColor"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="0.75"
    />
  );
}

function IconStar() {
  return (
    <path
      d="M12 2.5l2.7 5.9 6.3.8-4.7 4.1 1.4 6.2L12 16.9 6.3 19.5l1.4-6.2-4.7-4.1 6.3-.8L12 2.5z"
      fill="currentColor"
    />
  );
}

function IconFlag() {
  return (
    <path
      d="M6 3v18M7 4h9l-1.2 3L16 10H7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  );
}

function makeBadges(keys: string[], tone?: TileBadge["tone"]): TileBadge[] {
  return keys.map((key, idx) => ({
    key,
    tone,
    icon:
      idx % 3 === 0 ? <IconStar /> : idx % 3 === 1 ? <IconBolt /> : <IconFlag />,
  }));
}

type TileCase = {
  key: string;
  label: string;
  majoritySeat: SeatId;
  valueW?: number;
  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, React.ReactNode[]>>;
  badges: TileBadge[];
};

export default function HexTilePlayground() {
  const [zoom, setZoom] = useState(1.0);
  const [controlIndex, setControlIndex] = useState(0);
  const [forceHovered, setForceHovered] = useState(true);
  const [forceSelected, setForceSelected] = useState(true);
  const [mouseHoverIndex, setMouseHoverIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const tiles: TileCase[] = useMemo(
    () => [
      {
        key: "s1-compact",
        label: "Seat 1 / compact badges",
        majoritySeat: 1,
        valueW: 1,
        influenceBySeat: { 1: 2, 3: 1 },
        metaIconsBySeat: { 1: [<IconStar key="a" />], 3: [<IconFlag key="b" />] },
        badges: makeBadges(["A", "B"], "neutral"),
      },
      {
        key: "s2-belt",
        label: "Seat 2 / belt badges",
        majoritySeat: 2,
        valueW: 2,
        influenceBySeat: { 2: 4, 5: 1 },
        metaIconsBySeat: { 2: [<IconBolt key="a" />, <IconStar key="b" />] },
        badges: [
          ...makeBadges(["C"], "warn"),
          ...makeBadges(["D"], "neutral"),
          ...makeBadges(["E"], "danger"),
          ...makeBadges(["F"], "neutral"),
        ],
      },
      {
        key: "s3-meta",
        label: "Seat 3 / meta capsule",
        majoritySeat: 3,
        valueW: 3,
        influenceBySeat: { 3: 3 },
        metaIconsBySeat: { 3: [<IconFlag key="a" />, <IconFlag key="b" />, <IconStar key="c" />] },
        badges: makeBadges(["G"], "warn"),
      },
      {
        key: "s4-influence",
        label: "Seat 4 / multi influence",
        majoritySeat: 4,
        valueW: 4,
        influenceBySeat: { 1: 1, 2: 2, 4: 1, 6: 3 },
        metaIconsBySeat: { 6: [<IconBolt key="a" />] },
        badges: [],
      },
      {
        key: "s5-badges",
        label: "Seat 5 / more badges",
        majoritySeat: 5,
        valueW: 5,
        influenceBySeat: { 5: 5 },
        metaIconsBySeat: {},
        badges: [...makeBadges(["H"], "neutral"), ...makeBadges(["I"], "warn"), ...makeBadges(["J"], "danger")],
      },
      {
        key: "s6-empty",
        label: "Seat 6 / minimal",
        majoritySeat: 6,
        valueW: 6,
        influenceBySeat: { 6: 1 },
        metaIconsBySeat: {},
        badges: [],
      },
    ],
    []
  );

  const tileH = DEFAULT_TILE_H * zoom;
  const tileW = tileH * TILE_ASPECT;

  const clampedControlIndex = clamp(controlIndex, 0, tiles.length - 1);

  return (
    <div style={{ padding: 16, color: "var(--text-primary)" }}>
      <div className="glass-panel" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Dev Preview: HexTile playground</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>Zoom</span>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span style={{ width: 48, textAlign: "right" }}>{zoom.toFixed(2)}x</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>Control tile</span>
            <select value={clampedControlIndex} onChange={(e) => setControlIndex(Number(e.target.value))}>
              {tiles.map((t, idx) => (
                <option key={t.key} value={idx}>
                  {idx + 1}: {t.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={forceHovered} onChange={(e) => setForceHovered(e.target.checked)} />
            <span>Force hover</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={forceSelected} onChange={(e) => setForceSelected(e.target.checked)} />
            <span>Force selected</span>
          </label>

          <button
            className="btn-secondary"
            onClick={() => {
              setMouseHoverIndex(null);
              setClickedIndex(null);
            }}
          >
            Reset click/hover
          </button>
        </div>
        <div style={{ opacity: 0.75, marginTop: 8, fontSize: 12 }}>
          Tip: open via <code>?dev=hex-tile</code> (dev mode only). Click tiles to toggle selection; hover to preview.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, max-content)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {tiles.map((t, idx) => {
          const isControlled = idx === clampedControlIndex;
          const isHovered = (forceHovered && isControlled) || mouseHoverIndex === idx;
          const isSelected = (forceSelected && isControlled) || clickedIndex === idx;

          return (
            <div
              key={t.key}
              className="glass-panel"
              style={{
                padding: 10,
                width: tileW + 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, opacity: 0.9 }}>{t.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  H:{isHovered ? "1" : "0"} S:{isSelected ? "1" : "0"}
                </div>
              </div>

              <div
                style={{
                  ["--hex-cell-w" as any]: `${tileW}px`,
                  ["--hex-cell-h" as any]: `${tileH}px`,
                  position: "relative",
                }}
                onMouseEnter={() => setMouseHoverIndex(idx)}
                onMouseLeave={() => setMouseHoverIndex((prev) => (prev === idx ? null : prev))}
                onClick={() => setClickedIndex((prev) => (prev === idx ? null : idx))}
                role="button"
                tabIndex={0}
              >
                <HexTileVisual
                  majoritySeat={t.majoritySeat}
                  seatColor={seatColor}
                  isHovered={isHovered}
                  isSelected={isSelected}
                  influenceBySeat={t.influenceBySeat}
                  metaIconsBySeat={t.metaIconsBySeat}
                  badges={t.badges}
                  valueW={t.valueW}
                  className="hex-tile-visual"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
