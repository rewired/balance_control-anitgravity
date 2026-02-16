import { resortIconUrlByResort, type ResortKey } from "./tileAssets";

export type ResortIconProps = {
  resort?: ResortKey;
};

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export function ResortIcon({ resort }: ResortIconProps) {
  const href = resort ? resortIconUrlByResort[resort] : null;

  if (!href) return null;

  return <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />;
}
