import React, { useMemo, useState } from 'react';
import type { GameState, Tile } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { selectTileController } from '@balance-control/game';
import { axialToPixel, computeBoardLayout, parseCoordString, stableSortCoords } from '../ui/hexLayout';
import { HexTileVisual } from '../ui/tiles/HexTileVisual';
import { ResortIcon } from '../ui/tiles/ResortIcon';
import { seatColor } from '../ui/tiles/seatColor';
import type { SeatId } from '../ui/tiles/types';

interface HexBoardProps {
    G: GameState;
    placeTileIntents: LegalIntent[];
    moveInfluenceIntents?: LegalIntent[];
    placeInfluenceIntents?: LegalIntent[];
    actionMode?: string;
    moveInfluenceSourceId?: string | null;
    ghostCoords: string[];
    isInteractive: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
    onProposeMove?: (intent: LegalIntent) => void;
    onDispatchIntent?: (intent: LegalIntent) => void;
    pendingTile?: Tile | null;
}

export const HEX_SIZE = 110;

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const HexBoard: React.FC<HexBoardProps> = ({
    G,
    placeTileIntents,
    moveInfluenceIntents,
    placeInfluenceIntents,
    actionMode,
    moveInfluenceSourceId,
    ghostCoords,
    isInteractive,
    selectedTileId,
    selectedCoord,
    onSelectTile,
    onProposeMove,
    onDispatchIntent,
    pendingTile
}) => {
    const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
    const [hoveredGhostCoord, setHoveredGhostCoord] = useState<string | null>(null);

    const occupiedCoords = useMemo(() => {
        return stableSortCoords(Object.keys(G.grid || {}));
    }, [G.grid]);

    const placeTileByCoord = useMemo(() => {
        const map = new Map<string, LegalIntent>();
        for (const intent of placeTileIntents) {
            let coord = intent.payload?.targetCoord;

            // Also support resolveChoice where selection is a coordinate
            if (!coord && intent.moveType === 'resolveChoice') {
                const sel = (intent.payload as any)?.selection;
                if (typeof sel === 'string' && /^-?\d+,-?\d+$/.test(sel)) {
                    coord = sel;
                }
            }

            if (typeof coord !== 'string' || coord.length === 0) continue;
            if (!map.has(coord)) {
                map.set(coord, intent);
            }
        }
        return map;
    }, [placeTileIntents]);

    const allCoords = useMemo(() => {
        return stableSortCoords([...occupiedCoords, ...ghostCoords]);
    }, [occupiedCoords, ghostCoords]);

    const { width, height, offsetX, offsetY, cellWidth, cellHeight } = useMemo(() => {
        return computeBoardLayout(allCoords, HEX_SIZE);
    }, [allCoords]);

    const playerIdToSeatId = (playerId: string): SeatId | null => {
        const n = Number(playerId);
        if (!Number.isInteger(n)) return null;
        const seat = n + 1;
        if (seat < 1 || seat > 6) return null;
        return seat as SeatId;
    };

    return (
        <div className="hex-board" style={{ width, height }} data-testid="hex-board">
            <div className="hex-layer hex-layer-tiles">
                {occupiedCoords.map((coordStr) => {
                    const tileId = G.grid[coordStr];
                    if (!G.tiles[tileId]) return null;
                    const coord = parseCoordString(coordStr);
                    const { x, y } = axialToPixel(coord, HEX_SIZE);

                    let isValidTarget = false;
                    let targetIntent: LegalIntent | null = null;

                    if (actionMode === 'placeInfluence') {
                        targetIntent = placeInfluenceIntents?.find(i => i.payload.targetTileId === tileId) ?? null;
                        isValidTarget = !!targetIntent;
                    } else if (actionMode === 'moveInfluence') {
                        if (!moveInfluenceSourceId) {
                            isValidTarget = moveInfluenceIntents?.some(i => i.payload.sourceId === tileId) ?? false;
                        } else {
                            targetIntent = moveInfluenceIntents?.find(
                                i => i.payload.sourceId === moveInfluenceSourceId && i.payload.targetId === tileId
                            ) ?? null;
                            isValidTarget = !!targetIntent;
                        }
                    } else {
                        isValidTarget = false;
                        targetIntent = null;
                    }

                    const isSelected = selectedTileId === tileId || selectedCoord === coordStr || moveInfluenceSourceId === tileId;
                    const isHot = isSelected || hoveredTileId === tileId || isValidTarget;
                    const disabled = !isInteractive;
                    const testId = `hex-tile-${coordStr.replace(',', '_')}`;

                    const tile = G.tiles[tileId];
                    const controller = selectTileController(tileId, G);
                    const majoritySeat = controller ? playerIdToSeatId(controller) : null;

                    const zone = G.zones[tileId];
                    const influenceBySeat: Partial<Record<SeatId, number>> = {};
                    if (zone) {
                        for (const itemId of zone.items) {
                            const obj = G.objects[itemId];
                            if (obj?.type !== 'Influence' || !obj.owner) continue;
                            const seat = playerIdToSeatId(obj.owner);
                            if (!seat) continue;
                            influenceBySeat[seat] = (influenceBySeat[seat] ?? 0) + 1;
                        }
                    }

                    return (
                        <div
                            key={coordStr}
                            className={[
                                'hex-cell',
                                isSelected ? 'hex-cell-selected' : null,
                                isValidTarget ? 'hex-cell-target' : null,
                                isHot ? 'hex-cell-hot' : null
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                ['--hex-cell-w' as any]: `${cellWidth}px`,
                                ['--hex-cell-h' as any]: `${cellHeight}px`
                            }}
                            data-testid={testId}
                            title={`coord ${coordStr}`}
                            onMouseEnter={() => setHoveredTileId(tileId)}
                            onMouseLeave={() => setHoveredTileId((prev) => (prev === tileId ? null : prev))}
                            onClick={
                                disabled
                                    ? undefined
                                    : isValidTarget && targetIntent && onProposeMove
                                        ? () => onProposeMove(targetIntent!)
                                        : () => onSelectTile && onSelectTile(tileId, coordStr)
                            }
                            role={disabled ? undefined : 'button'}
                            tabIndex={disabled ? undefined : 0}
                        >
                            <HexTileVisual
                                majoritySeat={majoritySeat}
                                seatColor={seatColor}
                                isHovered={hoveredTileId === tileId}
                                isSelected={isSelected}
                                influenceBySeat={influenceBySeat}
                                metaIconsBySeat={{}}
                                badges={[]}
                                resortIcon={<ResortIcon resort={tile.resort} />}
                                valueW={typeof tile.weight === 'number' ? tile.weight : undefined}
                                className="hex-tile-visual"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="hex-layer hex-layer-ghosts">
                {ghostCoords.map((coordStr) => {
                    const intent = placeTileByCoord.get(coordStr);
                    if (!intent) return null;
                    const coord = parseCoordString(coordStr);
                    const { x, y } = axialToPixel(coord, HEX_SIZE);
                    const testId = `hex-ghost-${coordStr.replace(',', '_')}`;
                    const isGhostHovered = hoveredGhostCoord === coordStr;
                    return (
                        <button
                            key={`ghost-${coordStr}`}
                            className={[
                                'hex-cell',
                                'hex-ghost',
                                isInteractive ? 'hex-ghost-active' : null
                            ].filter(Boolean).join(' ')}
                            disabled={!isInteractive}
                            onClick={!isInteractive ? undefined : () => onDispatchIntent?.(intent)}
                            onMouseEnter={() => setHoveredGhostCoord(coordStr)}
                            onMouseLeave={() => setHoveredGhostCoord((prev) => (prev === coordStr ? null : prev))}
                            data-testid={testId}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                ['--hex-cell-w' as any]: `${cellWidth}px`,
                                ['--hex-cell-h' as any]: `${cellHeight}px`
                            }}
                            title={`Place at ${coordStr}`}
                        >
                            {pendingTile && isGhostHovered && (
                                <div className="ghost-preview" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                                    <HexTileVisual
                                        majoritySeat={null}
                                        seatColor={seatColor}
                                        isHovered={false}
                                        isSelected={false}
                                        influenceBySeat={{}}
                                        metaIconsBySeat={{}}
                                        badges={[]}
                                        resortIcon={<ResortIcon resort={pendingTile.resort} />}
                                        valueW={typeof pendingTile.weight === 'number' ? pendingTile.weight : undefined}
                                        className="hex-tile-visual"
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
