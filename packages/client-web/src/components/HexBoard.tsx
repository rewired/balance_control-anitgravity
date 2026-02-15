import React, { useMemo } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { Tile } from './Tile';
import { axialToPixel, computeBoardLayout, parseCoordString, stableSortCoords } from '../ui/hexLayout';

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

    return (
        <div className="hex-board" style={{ width, height }} data-testid="hex-board">
            <div className="hex-layer hex-layer-tiles">
                {occupiedCoords.map((coordStr) => {
                    const tileId = G.grid[coordStr];
                    if (!G.tiles[tileId]) return null;
                    const coord = parseCoordString(coordStr);
                    const { x, y } = axialToPixel(coord, HEX_SIZE);
                    const isSelected = selectedTileId === tileId || selectedCoord === coordStr;
                    const disabled = !isInteractive;
                    const testId = `hex-tile-${coordStr.replace(',', '_')}`;
                    return (
                        <div
                            key={coordStr}
                            className={isSelected ? 'hex-cell hex-cell-selected' : 'hex-cell'}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                width: cellWidth,
                                height: cellHeight
                            }}
                            data-testid={testId}
                        >
                            <Tile
                                tileId={tileId}
                                G={G}
                                onClick={disabled ? undefined : () => onSelectTile && onSelectTile(tileId, coordStr)}
                                selected={isSelected}
                                disabled={disabled}
                                tooltip={`coord ${coordStr}`}
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
                                width: cellWidth,
                                height: cellHeight
                            }}
                            title={`Place at ${coordStr}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};
