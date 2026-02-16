import { OVERLAY_RENDER_RECT } from "./tileGeometry";
import { tileOverlayUrl } from "./tileAssets";

export function GlassOverlay() {
  return (
    <image
      href={tileOverlayUrl}
      x={OVERLAY_RENDER_RECT.x}
      y={OVERLAY_RENDER_RECT.y}
      width={OVERLAY_RENDER_RECT.width}
      height={OVERLAY_RENDER_RECT.height}
      preserveAspectRatio={OVERLAY_RENDER_RECT.preserveAspectRatio}
      style={{ mixBlendMode: "luminosity", opacity: 0.8, pointerEvents: "none" }}
    />
  );
}
