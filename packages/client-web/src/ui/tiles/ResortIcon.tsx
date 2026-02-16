import domIconUrl from "../../assets/tile-icons/dom.svg";
import infIconUrl from "../../assets/tile-icons/inf.svg";
import forIconUrl from "../../assets/tile-icons/for.svg";

export type ResortIconProps = {
  resort?: string;
};

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export function ResortIcon({ resort }: ResortIconProps) {
  const href =
    resort === "DOM" ? domIconUrl : resort === "INF" ? infIconUrl : resort === "FOR" ? forIconUrl : null;

  if (!href) return null;

  return <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />;
}
