import React, { useMemo, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { computeMajority } from '../../../game/src/mechanics';
import { axialToPixel, computeBoardLayout, parseCoordString, stableSortCoords } from '../ui/hexLayout';
import { HexTileVisual } from '../ui/tiles/HexTileVisual';
import { seatColor } from '../ui/tiles/seatColor';
import type { SeatId } from '../ui/tiles/types';

interface HexBoardProps {
    G: GameState;
    moves: any;
    intents: LegalIntent[];
    isInteractive: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
}

export const HEX_SIZE = 110;

export const HexBoard: React.FC<HexBoardProps> = ({
    G,
    moves,
    intents,
    isInteractive,
    selectedTileId,
    selectedCoord,
    onSelectTile
}) => {
    const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);

    const occupiedCoords = useMemo(() => {
        return stableSortCoords(Object.keys(G.grid || {}));
    }, [G.grid]);

    const ghostCoords = useMemo(() => {
        const coords = intents
            .filter((intent) => intent.moveType === 'placeTile' && intent.payload?.targetCoord)
            .map((intent) => intent.payload.targetCoord);
        const unique = Array.from(new Set(coords));
        return stableSortCoords(unique);
    }, [intents]);

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
                    const isSelected = selectedTileId === tileId || selectedCoord === coordStr;
                    const isHot = isSelected || hoveredTileId === tileId;
                    const disabled = !isInteractive;
                    const testId = `hex-tile-${coordStr.replace(',', '_')}`;

                    const tile = G.tiles[tileId];
                    const controller = computeMajority(tileId, G).controller;
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
                            onClick={disabled ? undefined : () => onSelectTile && onSelectTile(tileId, coordStr)}
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
                                valueW={typeof tile.weight === 'number' ? tile.weight : undefined}
                                className="hex-tile-visual"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="hex-layer hex-layer-ghosts">
                {ghostCoords.map((coordStr) => {
                    const intent = intents.find(
                        (candidate) => candidate.moveType === 'placeTile' && candidate.payload?.targetCoord === coordStr
                    );
                    if (!intent) return null;
                    const coord = parseCoordString(coordStr);
                    const { x, y } = axialToPixel(coord, HEX_SIZE);
                    const testId = `hex-ghost-${coordStr.replace(',', '_')}`;
                    return (
                        <button
                            key={`ghost-${coordStr}`}
                            className="hex-cell hex-ghost"
                            disabled={!isInteractive}
                            onClick={!isInteractive ? undefined : () => moves[intent.moveType](intent.payload)}
                            data-testid={testId}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                ['--hex-cell-w' as any]: `${cellWidth}px`,
                                ['--hex-cell-h' as any]: `${cellHeight}px`
                            }}
                            title={`Place at ${coordStr}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};
