import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { HexTileVisual } from "../HexTileVisual";
import { ResortIcon } from "../ResortIcon";
import {
  CENTER_ABS,
  INFLUENCE_CAPSULE_LABEL_GAP,
  INFLUENCE_META_ICON_GAP,
  INFLUENCE_META_ICON_SIZE,
  MARKER_RADIUS,
  OVERLAY_RENDER_RECT,
} from "../tileGeometry";
import type { SeatId, TileBadge } from "../types";
import { resortIconUrlByResort } from "../tileAssets";

afterEach(() => cleanup());

const seatColor = (_seat: SeatId) => "#123456";

function renderHexTileVisual(overrides: Partial<React.ComponentProps<typeof HexTileVisual>> = {}) {
  return render(
    <HexTileVisual
      majoritySeat={null}
      seatColor={seatColor}
      isHovered={false}
      isSelected={false}
      influenceBySeat={{}}
      metaIconsBySeat={{}}
      badges={[]}
      {...overrides}
    />
  );
}

describe("HexTileVisual smoke", () => {
  it("renders with majoritySeat=null, no badges, no markers", () => {
    const { container } = renderHexTileVisual();
    const svg = container.querySelector('svg[data-component="HexTileVisual"]');
    expect(svg).not.toBeNull();

    const overlay = container.querySelector("image");
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute("x")).toBe(String(OVERLAY_RENDER_RECT.x));
    expect(overlay?.getAttribute("y")).toBe(String(OVERLAY_RENDER_RECT.y));
    expect(overlay?.getAttribute("width")).toBe(String(OVERLAY_RENDER_RECT.width));
    expect(overlay?.getAttribute("height")).toBe(String(OVERLAY_RENDER_RECT.height));
    expect(overlay?.getAttribute("preserveAspectRatio")).toBe(OVERLAY_RENDER_RECT.preserveAspectRatio);

    const overlayStyle = overlay?.getAttribute("style") ?? "";
    expect(overlayStyle).toMatch(/mix-blend-mode:\s*luminosity/);
    expect(overlayStyle).toMatch(/opacity:\s*0\.8/);

    expect(container.querySelector('g[pointer-events="none"]')).toBeNull();
  });

  it("hides markers when hover=false and selected=false", () => {
    const { container } = renderHexTileVisual({
      majoritySeat: 1,
      isHovered: false,
      isSelected: false,
      influenceBySeat: { 1: 2 },
    });

    expect(container.querySelector('g[pointer-events="none"]')).toBeNull();
    expect(screen.queryByText("2")).toBeNull();
  });

  it("shows markers with numbers when hover=true", () => {
    const { container } = renderHexTileVisual({
      isHovered: true,
      influenceBySeat: { 1: 3 },
    });

    expect(container.querySelector('g[pointer-events="none"]')).not.toBeNull();
    expect(screen.getByText("3")).not.toBeNull();
  });

  it("renders a capsule (rect) when metaIcons exist and expands width deterministically", () => {
    const { container } = renderHexTileVisual({
      isHovered: true,
      influenceBySeat: { 1: 1 },
      metaIconsBySeat: {
        1: [<circle key="meta" cx="12" cy="12" r="10" />],
      },
    });

    const capsule = container.querySelector("rect");
    expect(capsule).not.toBeNull();

    const capsuleWidth = Number(capsule?.getAttribute("width"));
    const expectedWidth =
      2 * MARKER_RADIUS + INFLUENCE_CAPSULE_LABEL_GAP + 1 * (INFLUENCE_META_ICON_SIZE + INFLUENCE_META_ICON_GAP);
    expect(capsuleWidth).toBeCloseTo(expectedWidth, 4);
  });

  it("switches badge layout mode (compact vs belt) based on badge count", () => {
    const badgeIcon = <circle cx="12" cy="12" r="10" />;
    const badges2: TileBadge[] = [
      { key: "b1", icon: badgeIcon },
      { key: "b2", icon: badgeIcon },
    ];
    const badges4: TileBadge[] = [
      { key: "b1", icon: badgeIcon },
      { key: "b2", icon: badgeIcon },
      { key: "b3", icon: badgeIcon },
      { key: "b4", icon: badgeIcon },
    ];

    const { container: compact } = renderHexTileVisual({ badges: badges2 });
    expect(compact.querySelectorAll("rect")).toHaveLength(2);

    const { container: belt } = renderHexTileVisual({ badges: badges4 });
    expect(belt.querySelectorAll("rect")).toHaveLength(4);
  });

  it("renders valueW centered and shifted up (y = center - 10) without 'W' prefix", () => {
    const [cx, cy] = CENTER_ABS;
    renderHexTileVisual({ valueW: 7 });

    const valueText = screen.getByText("7");
    expect(valueText.tagName.toLowerCase()).toBe("text");
    expect(valueText.getAttribute("x")).toBe(String(cx));
    expect(valueText.getAttribute("y")).toBe(String(cy - 10));
    expect(valueText.textContent).toBe("7");
    expect(screen.queryByText("W7")).toBeNull();
  });

  it.each([
    ["DOM", resortIconUrlByResort.DOM],
    ["INF", resortIconUrlByResort.INF],
    ["FOR", resortIconUrlByResort.FOR],
  ] as const)("renders resort icon image when provided (%s)", (resort, expectedHref) => {
    const { container } = renderHexTileVisual({ resortIcon: <ResortIcon resort={resort} /> });
    const images = Array.from(container.querySelectorAll("image"));
    expect(images.length).toBeGreaterThanOrEqual(2);

    const hrefs = images
      .map((img) => img.getAttribute("href") ?? img.getAttribute("xlink:href"))
      .filter((v): v is string => typeof v === "string");

    expect(hrefs).toContain(expectedHref);
  });
});
