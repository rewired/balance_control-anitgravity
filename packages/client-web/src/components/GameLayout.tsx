import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import { enumerateLegalIntents, type LegalIntent } from '@balance-control/game';
import { Zone } from './Zone';
import { ActionPanel } from './ActionPanel';
import { BoardViewport } from './BoardViewport';
import { PendingChoiceModal } from './PendingChoiceModal';

interface GameLayoutProps {
    G: GameState;
    ctx: any;
    moves: any;
    playerID: string | null;
    isActive: boolean;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ G, ctx, moves, playerID, isActive }) => {
    const zoneNames = {
        PersonalSupply: 'PersonalSupply',
        Bank: 'Bank',
        Board: 'Board',
        DrawPile: 'DrawPile',
        Noise: 'Noise'
    } as const;

    // Determine player's personal supply
    const myPid = playerID ?? ctx.currentPlayer ?? '0';
    const mySupplyId = `${zoneNames.PersonalSupply}:${myPid}`;
    const stage = useMemo(() => {
        const pid = playerID ?? ctx.currentPlayer;
        const ap = ctx.activePlayers || {};
        return ap[pid] || null;
    }, [ctx, playerID]);

    const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;
    const intents: LegalIntent[] = useMemo(() => {
        return enumerateLegalIntents(G, ctx, myPid);
    }, [G, ctx, myPid]);

    const handleSelectTile = useCallback((tileId: string | null, coordStr: string | null) => {
        setSelectedTileId(tileId);
        setSelectedCoord(coordStr);
    }, []);

    useEffect(() => {
        if (selectedCoord) {
            const tileAtCoord = G.grid?.[selectedCoord] ?? null;
            if (!tileAtCoord) {
                if (selectedTileId) {
                    setSelectedTileId(null);
                    setSelectedCoord(null);
                }
                return;
            }
            if (tileAtCoord !== selectedTileId) {
                setSelectedTileId(tileAtCoord);
            }
            return;
        }

        if (selectedTileId) {
            const match = Object.entries(G.grid || {}).find(([, tileId]) => tileId === selectedTileId);
            if (match) {
                setSelectedCoord(match[0]);
            }
        }
    }, [G.grid, selectedCoord, selectedTileId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedTileId(null);
                setSelectedCoord(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const inspectorData = useMemo(() => {
        if (!selectedTileId) return null;
        const tile = G.tiles[selectedTileId];
        if (!tile) return null;
        const coord = selectedCoord
            ?? Object.entries(G.grid || {}).find(([, tileId]) => tileId === selectedTileId)?.[0]
            ?? null;
        const influenceByOwner: Record<string, number> = {};
        const resourceByResort: Record<string, number> = {};
        const zoneItems = G.zones[selectedTileId]?.items || [];
        for (const itemId of zoneItems) {
            const obj = G.objects[itemId];
            if (!obj) continue;
            if (obj.type === 'Influence') {
                const owner = obj.owner ?? 'Unknown';
                influenceByOwner[owner] = (influenceByOwner[owner] || 0) + 1;
            }
            if (obj.type === 'Resource') {
                const resort = obj.resort ?? 'Unknown';
                resourceByResort[resort] = (resourceByResort[resort] || 0) + 1;
            }
        }
        return { tile, coord, influenceByOwner, resourceByResort };
    }, [G, selectedCoord, selectedTileId]);

    const hasPendingChoice = useMemo(() => {
        return intents.some((intent) => intent.moveType === 'resolveChoice');
    }, [intents]);

    const isInteractive = isActive && !hasPendingChoice;

    return (
        <div className="game-layout">
            <PendingChoiceModal intents={intents} moves={moves} />

            {/* Left Panel: Bank & Supply */}
            <aside className="left-panel glass-panel">
                <div className="player-info">
                    <h3>Player {myPid}</h3>
                    <div className="status-indicator" style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: ctx.currentPlayer === myPid ? 'var(--accent-eco)' : 'var(--text-secondary)'
                    }} />
                </div>

                <Zone zoneId={mySupplyId} G={G} title="My Supply" />
                <Zone zoneId={zoneNames.Bank} G={G} title="Bank" />
            </aside>

            {/* Center: Board */}
            <main className="center-panel glass-panel">
                <h3>Board</h3>
                <BoardViewport
                    G={G}
                    moves={moves}
                    intents={intents}
                    isInteractive={isInteractive}
                    selectedTileId={selectedTileId}
                    selectedCoord={selectedCoord}
                    onSelectTile={handleSelectTile}
                />
            </main>

            {/* Right Panel: Opponents / Deck / Info */}
            <aside className="right-panel glass-panel">
                <div className="inspector-panel" data-testid="inspector-panel">
                    <h3>Inspector</h3>
                    {!inspectorData && (
                        <div className="inspector-empty" data-testid="inspector-empty">
                            No tile selected
                        </div>
                    )}
                    {inspectorData && (
                        <div className="inspector-details">
                            <div className="inspector-row">
                                <span className="inspector-label">Coord</span>
                                <span className="inspector-value" data-testid="inspector-coord">
                                    {inspectorData.coord ?? 'N/A'}
                                </span>
                            </div>
                            <div className="inspector-row">
                                <span className="inspector-label">Type</span>
                                <span className="inspector-value">{inspectorData.tile.type}</span>
                            </div>
                            <div className="inspector-row">
                                <span className="inspector-label">Resort</span>
                                <span className="inspector-value">{inspectorData.tile.resort ?? 'N/A'}</span>
                            </div>
                            <div className="inspector-row">
                                <span className="inspector-label">Weight</span>
                                <span className="inspector-value">
                                    {typeof inspectorData.tile.weight === 'number' ? inspectorData.tile.weight : 'N/A'}
                                </span>
                            </div>
                            <div className="inspector-section">
                                <div className="inspector-subtitle">Influence</div>
                                {Object.keys(inspectorData.influenceByOwner).length === 0 && (
                                    <div className="inspector-empty">None</div>
                                )}
                                {Object.entries(inspectorData.influenceByOwner)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([owner, count]) => (
                                        <div key={owner} className="inspector-row">
                                            <span className="inspector-label">{owner}</span>
                                            <span className="inspector-value">{count}</span>
                                        </div>
                                    ))}
                            </div>
                            <div className="inspector-section">
                                <div className="inspector-subtitle">Resources</div>
                                {Object.keys(inspectorData.resourceByResort).length === 0 && (
                                    <div className="inspector-empty">None</div>
                                )}
                                {Object.entries(inspectorData.resourceByResort)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([resort, count]) => (
                                        <div key={resort} className="inspector-row">
                                            <span className="inspector-label">{resort}</span>
                                            <span className="inspector-value">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
                <Zone zoneId={zoneNames.DrawPile} G={G} title="Draw Pile" />
                <Zone zoneId={zoneNames.Noise} G={G} title="Noise" />
            </aside>

            {/* Bottom Controls */}
            {!hasPendingChoice && (
                <div className="controls-container glass-panel">
                    <ActionPanel
                        moves={moves}
                        isActive={isActive}
                        stage={stage}
                        intents={intents}
                        selectedTileId={selectedTileId}
                        stagedTileId={stagedTileId}
                    />
                </div>
            )}
        </div>
    );
};
