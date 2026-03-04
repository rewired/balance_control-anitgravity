import { tileIconUrlByType } from "./tileAssets";

const DEFAULT_ICON_VIEWBOX_SIZE = 24;

export interface LobbyistIconProps {
    mode?: 'ReturnPenalty' | 'Convert' | 'None';
}

export function LobbyistIcon({ mode }: LobbyistIconProps) {
    const href = tileIconUrlByType.Lobbyist;

    const modeLabel = mode === 'ReturnPenalty' ? 'RP' : mode === 'Convert' ? 'C' : undefined;
    const modeSymbol = mode === 'ReturnPenalty' ? '↩︎' : mode === 'Convert' ? '♻︎' : undefined;
    const modeTitle = mode === 'ReturnPenalty' ? 'Return Penalty' : mode === 'Convert' ? 'Convert' : 'Meta-Marker';

    return (
        <g>
            <title>{modeTitle}</title>
            <image href={href} x={0} y={0} width={DEFAULT_ICON_VIEWBOX_SIZE} height={DEFAULT_ICON_VIEWBOX_SIZE} />
            {modeSymbol && (
                <text
                    x={DEFAULT_ICON_VIEWBOX_SIZE}
                    y={DEFAULT_ICON_VIEWBOX_SIZE}
                    fontSize="10"
                    fontWeight="bold"
                    fill="currentColor"
                    textAnchor="end"
                    dominantBaseline="alphabetic"
                    style={{ pointerEvents: 'none', filter: 'drop-shadow(0 0 1px black)' }}
                >
                    {modeSymbol}
                </text>
            )}
        </g>
    );
}
