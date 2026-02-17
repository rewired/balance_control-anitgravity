import { resortIconUrlByResort, type ResortKey } from "./tileAssets";

export type ResortIconProps = {
  resort?: string;
};

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

function isResortKey(value: string): value is ResortKey {
  return value in resortIconUrlByResort;
}

export function ResortIcon({ resort }: ResortIconProps) {
  const href = resort && isResortKey(resort) ? resortIconUrlByResort[resort] : null;

  if (!href) return null;

  return <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />;
}
