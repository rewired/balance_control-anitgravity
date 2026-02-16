import overlayUrl from "../../assets/tiles/tile-overlay.png";

import { OVERLAY_RENDER_RECT } from "./tileGeometry";

export function GlassOverlay() {
  return (
    <image
      href={overlayUrl}
      x={OVERLAY_RENDER_RECT.x}
      y={OVERLAY_RENDER_RECT.y}
      width={OVERLAY_RENDER_RECT.width}
      height={OVERLAY_RENDER_RECT.height}
      preserveAspectRatio={OVERLAY_RENDER_RECT.preserveAspectRatio}
      style={{ mixBlendMode: "luminosity", opacity: 0.8, pointerEvents: "none" }}
    />
  );
}
