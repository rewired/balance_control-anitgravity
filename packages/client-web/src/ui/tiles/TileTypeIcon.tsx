import { tileIconUrlByType, type TileTypeIconKey } from "./tileAssets";

export type TileTypeIconProps = {
  type?: string;
};

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export function isTileTypeKey(value: string): value is TileTypeIconKey {
  return value in tileIconUrlByType;
}

export function TileTypeIcon({ type }: TileTypeIconProps) {
  const href = type && isTileTypeKey(type) ? tileIconUrlByType[type] : null;

  if (!href) return null;

  return <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />;
}
