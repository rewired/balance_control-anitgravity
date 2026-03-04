import React, { useMemo, useState } from 'react';
import type { GameState, Tile } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { selectTileController } from '@balance-control/game';
import { axialToPixel, computeBoardLayout, parseCoordString, stableSortCoords } from '../ui/hexLayout';
import { HexTileVisual } from '../ui/tiles/HexTileVisual';
import { ResortIcon, isResortKey } from '../ui/tiles/ResortIcon';
import { TileTypeIcon, isTileTypeKey } from '../ui/tiles/TileTypeIcon';
import { seatColor } from '../ui/tiles/seatColor';
import { LobbyistIcon } from '../ui/tiles/LobbyistIcon';
import type { SeatId } from '../ui/tiles/types';
import { HexSilhouette, HexOutline } from './HexSilhouette';
import { BoardHoverCard } from './BoardHoverCard';

interface HexBoardProps {
    G: GameState;
    placeTileIntents: LegalIntent[];
    moveInfluenceIntents?: LegalIntent[];
    placeInfluenceIntents?: LegalIntent[];
    formalizeInfluenceIntents?: LegalIntent[];
    convertResourcesIntents?: LegalIntent[];
    resolveChoiceIntents?: LegalIntent[];
    actionMode?: string;
    moveInfluenceSourceId?: string | null;
    ghostCoords: string[];
    isInteractive: boolean;
    canInspect?: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
    onProposeMove?: (intent: LegalIntent) => void;
    onResolveChoice?: (intent: LegalIntent) => void;
    pendingTile?: Tile | null;
    activePlayerId?: string;
    draftIntent?: LegalIntent | null;
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
    formalizeInfluenceIntents,
    convertResourcesIntents,
    resolveChoiceIntents,
    actionMode,
    moveInfluenceSourceId,
    ghostCoords,
    isInteractive,
    canInspect,
    selectedTileId,
    selectedCoord,
    onSelectTile,
    onProposeMove,
    onResolveChoice,
    pendingTile,
    activePlayerId,
    draftIntent
}) => {
    const [hoveredState, setHoveredState] = useState<{
        tileId: string;
        coord: string;
        rect: DOMRect;
    } | null>(null);
    const hoveredTileId = hoveredState?.tileId ?? null;
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

    const activeSeat = activePlayerId ? playerIdToSeatId(activePlayerId) : null;
    const activeSeatColor = activeSeat ? seatColor(activeSeat) : undefined;

    const getInfluenceForTile = (tileId: string) => {
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
        return influenceBySeat;
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
                    let isDestination = false;
                    let isResolveChoice = false;

                    const isDraftSource = draftIntent?.moveType === 'moveInfluence' && draftIntent.payload.sourceId === tileId;
                    const isDraftTarget = (
                        (draftIntent?.moveType === 'placeInfluence' && draftIntent.payload.targetTileId === tileId) ||
                        (draftIntent?.moveType === 'moveInfluence' && draftIntent.payload.targetId === tileId) ||
                        (draftIntent?.moveType === 'formalizeInfluence' && draftIntent.payload.committeeTileId === tileId) ||
                        (draftIntent?.moveType === 'convertResources' && draftIntent.payload.grassrootsTileId === tileId)
                    );
                    const isDrafted = isDraftSource || isDraftTarget;

                    if (!draftIntent) {
                        if (resolveChoiceIntents && resolveChoiceIntents.length > 0) {
                            targetIntent = resolveChoiceIntents.find(i => {
                                const sel = (i.payload as any).selection;
                                return sel === tileId || sel === coordStr;
                            }) ?? null;
                            isValidTarget = !!targetIntent;
                            isResolveChoice = isValidTarget;
                        } else if (actionMode === 'placeInfluence') {
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
                                if (isValidTarget) {
                                    isDestination = true;
                                }
                            }
                        } else if (actionMode === 'formalizeInfluence') {
                            isValidTarget = formalizeInfluenceIntents?.some(i => i.payload.committeeTileId === tileId) ?? false;
                            targetIntent = null; // Wizard will handle selection, not direct proposal
                        } else if (actionMode === 'convertResources') {
                            isValidTarget = convertResourcesIntents?.some(i => i.payload.grassrootsTileId === tileId) ?? false;
                            targetIntent = null; // Wizard will handle selection, not direct proposal
                        } else {
                            isValidTarget = false;
                            targetIntent = null;
                        }
                    }

                    const isSelected = selectedTileId === tileId || selectedCoord === coordStr || moveInfluenceSourceId === tileId;
                    const isHovered = hoveredTileId === tileId;
                    const isHot = isSelected || isHovered || isValidTarget || isDrafted;
                    const canClick = isInteractive || canInspect;
                    const disabled = !canClick;
                    const testId = `hex-tile-${coordStr.replace(',', '_')}`;

                    const tile = G.tiles[tileId];
                    const controller = selectTileController(tileId, G);
                    const majoritySeat = controller ? playerIdToSeatId(controller) : null;

                    const zone = G.zones[tileId];
                    const influenceBySeat: Partial<Record<SeatId, number>> = {};
                    const metaIconsBySeat: Partial<Record<SeatId, React.ReactNode[]>> = {};

                    if (zone) {
                        for (const itemId of zone.items) {
                            const obj = G.objects[itemId];
                            if (!obj || !obj.owner) continue;
                            const seat = playerIdToSeatId(obj.owner);
                            if (!seat) continue;

                            if (obj.type === 'Influence') {
                                influenceBySeat[seat] = (influenceBySeat[seat] ?? 0) + 1;
                            } else if (obj.type === 'MetaMarker') {
                                if (!metaIconsBySeat[seat]) metaIconsBySeat[seat] = [];
                                metaIconsBySeat[seat].push(<LobbyistIcon key={itemId} />);
                            }
                        }
                    }

                    return (
                        <div
                            key={coordStr}
                            className={[
                                'hex-cell',
                                isSelected ? 'hex-cell-selected' : null,
                                isHovered ? 'hex-cell-hovered' : null,
                                isValidTarget ? 'hex-cell-target' : null,
                                isDestination ? 'hex-cell-target-destination' : null,
                                isHot ? 'hex-cell-hot' : null,
                                isDrafted ? 'hex-cell-drafted' : null
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                ['--hex-cell-w' as any]: `${cellWidth}px`,
                                ['--hex-cell-h' as any]: `${cellHeight}px`,
                                ['--active-seat-color' as any]: isDestination ? activeSeatColor : undefined
                            }}
                            data-testid={testId}
                            title=""
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredState({ tileId, coord: coordStr, rect });
                            }}
                            onMouseLeave={() => setHoveredState((prev) => (prev?.tileId === tileId ? null : prev))}
                            onClick={
                                disabled
                                    ? undefined
                                    : (isInteractive && isResolveChoice && targetIntent && onResolveChoice)
                                        ? () => onResolveChoice(targetIntent!)
                                        : (isInteractive && !draftIntent && isValidTarget && targetIntent && onProposeMove)
                                            ? () => onProposeMove(targetIntent!)
                                            : () => canInspect && onSelectTile && onSelectTile(tileId, coordStr)
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
                                metaIconsBySeat={metaIconsBySeat}
                                badges={[]}
                                resortIcon={tile.type !== 'Grassroots' && tile.resort && isResortKey(tile.resort) ? <ResortIcon resort={tile.resort} /> : undefined}
                                typeIcon={(tile.type === 'Grassroots' || (!tile.resort && isTileTypeKey(tile.type))) ? <TileTypeIcon type={tile.type} /> : undefined}
                                typeTag={tile.type === 'Grassroots' ? (tile.conversion?.typedResort || tile.resort) : undefined}
                                valueW={typeof tile.weight === 'number' ? tile.weight : undefined}
                                className="hex-tile-visual"
                            />
                            {isDrafted && (
                                <div className="hex-preview-overlay">
                                    {isDraftTarget && draftIntent?.moveType === 'placeInfluence' && (
                                        <div className="hex-preview-marker influence" />
                                    )}
                                    {isDraftSource && (
                                        <div className="hex-preview-marker source" />
                                    )}
                                    {isDraftTarget && draftIntent?.moveType === 'moveInfluence' && (
                                        <div className="hex-preview-marker destination" />
                                    )}
                                    {isDraftTarget && (draftIntent?.moveType === 'formalizeInfluence' || draftIntent?.moveType === 'convertResources') && (
                                        <div className="hex-preview-highlight" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="hex-layer hex-layer-ghosts">
                {ghostCoords.map((coordStr) => {
                    const intent = placeTileByCoord.get(coordStr);
                    if (!intent && !draftIntent) return null;

                    const isDraftedGhost = draftIntent?.moveType === 'placeTile' && draftIntent.payload.targetCoord === coordStr;
                    if (!intent && !isDraftedGhost) return null;

                    const coord = parseCoordString(coordStr);
                    const { x, y } = axialToPixel(coord, HEX_SIZE);
                    const testId = `hex-ghost-${coordStr.replace(',', '_')}`;
                    const isGhostHovered = hoveredGhostCoord === coordStr;
                    const canPropose = !draftIntent && isInteractive;
                    const isResolveChoice = intent?.moveType === 'resolveChoice';

                    return (
                        <button
                            key={`ghost-${coordStr}`}
                            className={[
                                'hex-cell',
                                'hex-ghost',
                                canPropose ? 'hex-ghost-active' : null,
                                isDraftedGhost ? 'hex-ghost-drafted' : null
                            ].filter(Boolean).join(' ')}
                            disabled={!canPropose && !isDraftedGhost}
                            onClick={
                                canPropose
                                    ? (isResolveChoice && onResolveChoice)
                                        ? () => onResolveChoice(intent!)
                                        : () => onProposeMove?.(intent!)
                                    : undefined
                            }
                            onMouseEnter={() => setHoveredGhostCoord(coordStr)}
                            onMouseLeave={() => setHoveredGhostCoord((prev) => (prev === coordStr ? null : prev))}
                            data-testid={testId}
                            style={{
                                left: x + offsetX,
                                top: y + offsetY,
                                ['--hex-cell-w' as any]: `${cellWidth}px`,
                                ['--hex-cell-h' as any]: `${cellHeight}px`,
                                clipPath: 'url(#hex-outline-clip)'
                            }}
                            title={`Place at ${coordStr}`}
                        >
                            <HexOutline className="hex-ghost-outline" />
                            {((pendingTile && isGhostHovered) || (isDraftedGhost && pendingTile)) && (
                                <div className="ghost-preview" style={{ opacity: isDraftedGhost ? 0.9 : 0.6, pointerEvents: 'none' }}>
                                    <HexTileVisual
                                        majoritySeat={null}
                                        seatColor={seatColor}
                                        isHovered={false}
                                        isSelected={false}
                                        influenceBySeat={{}}
                                        metaIconsBySeat={{}}
                                        badges={[]}
                                        resortIcon={pendingTile!.type !== 'Grassroots' && pendingTile!.resort ? <ResortIcon resort={pendingTile!.resort} /> : undefined}
                                        typeIcon={(pendingTile!.type === 'Grassroots' || !pendingTile!.resort) ? <TileTypeIcon type={pendingTile!.type} /> : undefined}
                                        typeTag={pendingTile!.type === 'Grassroots' ? (pendingTile!.conversion?.typedResort || pendingTile!.resort) : undefined}
                                        valueW={typeof pendingTile!.weight === 'number' ? pendingTile!.weight : undefined}
                                        className="hex-tile-visual"
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            {hoveredState && G.tiles[hoveredState.tileId] && (
                <BoardHoverCard
                    tile={G.tiles[hoveredState.tileId]}
                    coord={hoveredState.coord}
                    influenceBySeat={getInfluenceForTile(hoveredState.tileId)}
                    seatColor={seatColor}
                    targetRect={hoveredState.rect}
                />
            )}
        </div>
    );
};
