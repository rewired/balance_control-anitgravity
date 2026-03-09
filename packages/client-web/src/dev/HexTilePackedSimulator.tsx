import React, { useEffect, useMemo, useState } from "react";

import { BoardViewport } from "../components/BoardViewport";
import { HEX_SIZE } from "../components/HexBoard";
import { axialToPixel, parseCoordString, stableSortCoords } from "../ui/hexLayout";
import { HexTileVisual } from "../ui/tiles/HexTileVisual";
import type { MetaMarkerEntry } from "../ui/tiles/MetaMarkerOverlay";
import { ResortIcon } from "../ui/tiles/ResortIcon";
import { seatColor } from "../ui/tiles/seatColor";
import type { SeatId, TileBadge } from "../ui/tiles/types";

const RADIUS = 3;
const NUM_TILES = 37;
const SEED = 0x0b_adc_0de;

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rand: () => number, minInclusive: number, maxInclusive: number) {
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rand() * span);
}

function randPick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function axialCoordStringsInRadius(radius: number): string[] {
  const coords: string[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push(`${q},${r}`);
    }
  }
  return stableSortCoords(coords);
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

function makeBadge(key: string, tone: TileBadge["tone"], iconIdx: number): TileBadge {
  const icon = iconIdx % 3 === 0 ? <IconStar /> : iconIdx % 3 === 1 ? <IconBolt /> : <IconFlag />;
  return { key, tone, icon };
}

type PackedTileCase = {
  coordStr: string;
  majoritySeat: SeatId;
  resort?: string;
  valueW?: number;
  influenceBySeat: Partial<Record<SeatId, number>>;
  metaMarkers: MetaMarkerEntry[];
  badges: TileBadge[];
};

export default function HexTilePackedSimulator() {
  const [hoveredCoord, setHoveredCoord] = useState<string | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<string | null>(null);

  const coordStrings = useMemo(() => axialCoordStringsInRadius(RADIUS), []);

  const tiles: PackedTileCase[] = useMemo(() => {
    const rand = mulberry32(SEED);
    const resorts = ["DOM", "FOR", "INF"];
    const tones: TileBadge["tone"][] = ["neutral", "warn", "danger"];

    return coordStrings.map((coordStr, idx) => {
      const majoritySeat = (((idx % 6) + 1) as SeatId);
      const valueW = ((idx % 6) + 1);
      const resort = randPick(rand, resorts);

      const influenceBySeat: Partial<Record<SeatId, number>> = {};
      const numInfluencedSeats = randInt(rand, 1, 3);
      const seatPool: SeatId[] = [1, 2, 3, 4, 5, 6];
      for (let i = 0; i < numInfluencedSeats; i++) {
        const seat = randPick(rand, seatPool);
        influenceBySeat[seat] = (influenceBySeat[seat] ?? 0) + randInt(rand, 1, 4);
      }

      const metaMarkers: MetaMarkerEntry[] = [];
      if (idx % 2 === 0) {
        const seat = (((idx % 6) + 1) as SeatId);
        const mode = idx % 4 === 0 ? "ReturnPenalty" : "Convert";
        metaMarkers.push({ seat, color: seatColor(seat), mode });
      }

      const badges: TileBadge[] = [];
      const badgeCount = randInt(rand, 0, 5);
      for (let i = 0; i < badgeCount; i++) {
        badges.push(makeBadge(`${coordStr}-b${i}`, randPick(rand, tones), i));
      }

      return {
        coordStr,
        majoritySeat,
        resort,
        valueW,
        influenceBySeat,
        metaMarkers,
        badges
      };
    });
  }, [coordStrings]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (coordStrings.length !== NUM_TILES) {
      throw new Error(`HexTilePackedSimulator expected ${NUM_TILES} tiles; got ${coordStrings.length}`);
    }

    const pixels = coordStrings.map((coordStr) => {
      const coord = parseCoordString(coordStr);
      return axialToPixel(coord, HEX_SIZE);
    });

    const expectedNeighborDist = HEX_SIZE * Math.sqrt(3);
    let minDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pixels.length; i++) {
      for (let j = i + 1; j < pixels.length; j++) {
        const dx = pixels[i]!.x - pixels[j]!.x;
        const dy = pixels[i]!.y - pixels[j]!.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0 && d < minDist) minDist = d;
      }
    }

    const epsilon = 0.5;
    if (Math.abs(minDist - expectedNeighborDist) > epsilon) {
      throw new Error(
        `Packed layout gap check failed: nearest center distance ${minDist.toFixed(3)} != expected ${expectedNeighborDist.toFixed(3)}`
      );
    }
  }, [coordStrings]);

  return (
    <div style={{ height: 720, minHeight: 520 }} data-testid="packed-simulator">
      <BoardViewport
        mode="dev"
        coordStrings={coordStrings}
        hexSize={HEX_SIZE}
        renderContent={(layout) => (
          <div className="hex-board" style={{ width: layout.width, height: layout.height }} data-testid="hex-board-packed">
            <div className="hex-layer hex-layer-tiles">
              {tiles.map((t) => {
                const coord = parseCoordString(t.coordStr);
                const { x, y } = axialToPixel(coord, HEX_SIZE);
                const isHovered = hoveredCoord === t.coordStr;
                const isSelected = selectedCoord === t.coordStr;
                return (
                  <div
                    key={t.coordStr}
                    className={[
                      "hex-cell",
                      isSelected ? "hex-cell-selected" : null,
                      isHovered ? "hex-cell-hot" : null
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      left: x + layout.offsetX,
                      top: y + layout.offsetY,
                      ["--hex-cell-w" as any]: `${layout.cellWidth}px`,
                      ["--hex-cell-h" as any]: `${layout.cellHeight}px`
                    }}
                    title={`coord ${t.coordStr}`}
                    onMouseEnter={() => setHoveredCoord(t.coordStr)}
                    onMouseLeave={() => setHoveredCoord((prev) => (prev === t.coordStr ? null : prev))}
                    onClick={() => setSelectedCoord((prev) => (prev === t.coordStr ? null : t.coordStr))}
                    role="button"
                    tabIndex={0}
                    data-testid={`packed-tile-${t.coordStr.replace(",", "_")}`}
                  >
                    <HexTileVisual
                      majoritySeat={t.majoritySeat}
                      seatColor={seatColor}
                      isHovered={isHovered}
                      isSelected={isSelected}
                      influenceBySeat={t.influenceBySeat}
                      metaMarkers={t.metaMarkers}
                      badges={t.badges}
                      resortIcon={<ResortIcon resort={t.resort} />}
                      valueW={t.valueW}
                      className="hex-tile-visual"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      />
    </div>
  );
}
