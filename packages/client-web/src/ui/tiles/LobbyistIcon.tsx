import { tileIconUrlByType } from "./tileAssets";

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export function LobbyistIcon() {
    const href = tileIconUrlByType.Lobbyist;

    return <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />;
}
