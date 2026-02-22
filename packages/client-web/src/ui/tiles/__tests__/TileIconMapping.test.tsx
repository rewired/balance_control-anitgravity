import { describe, expect, it, afterEach } from "vitest";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { TileTypeIcon } from "../TileTypeIcon";
import { tileIconUrlByType } from "../tileAssets";

afterEach(() => cleanup());

describe("TileIconMapping", () => {
  it("has all required icons in registry", () => {
    expect(tileIconUrlByType.Committee).toBeDefined();
    expect(tileIconUrlByType.Grassroots).toBeDefined();
    expect(tileIconUrlByType.Hotspot).toBeDefined();
    expect(tileIconUrlByType.Lobbyist).toBeDefined();
    expect(tileIconUrlByType.StartCommittee).toBeDefined();
  });

  it.each([
    ["Committee", tileIconUrlByType.Committee],
    ["Grassroots", tileIconUrlByType.Grassroots],
    ["Hotspot", tileIconUrlByType.Hotspot],
    ["Lobbyist", tileIconUrlByType.Lobbyist],
    ["StartCommittee", tileIconUrlByType.StartCommittee],
  ] as const)("renders tile type icon when provided (%s)", (type, expectedHref) => {
    const { container } = render(<svg><TileTypeIcon type={type} /></svg>);
    const image = container.querySelector("image");
    expect(image).not.toBeNull();
    
    const href = image?.getAttribute("href") ?? image?.getAttribute("xlink:href");
    expect(href).toBe(expectedHref);
  });
});
