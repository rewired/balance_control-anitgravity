import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import { Zone } from './Zone';
import { ActionPanel } from './ActionPanel';
import { BoardViewport } from './BoardViewport';
import { PendingChoiceModal } from './PendingChoiceModal';
import { PublicNoticeOverlay } from './PublicNoticeOverlay';
import { useIntentViewModel } from '../ui/useIntentViewModel';
import { ResortIcon } from '../ui/tiles/ResortIcon';

interface GameLayoutProps {
    G: GameState;
    ctx: any;
    moves: any;
    playerID: string | null;
    isActive: boolean;
}

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const GameLayout: React.FC<GameLayoutProps> = ({ G, ctx, moves, playerID, isActive }) => {
    const zoneNames = {
        PersonalSupply: 'PersonalSupply',
        Bank: 'Bank',
        Board: 'Board',
        DrawPile: 'DrawPile',
        DiscardFaceUp: 'DiscardFaceUp',
        Noise: 'Noise'
    } as const;

    // Determine player's personal supply
    const myPid = playerID ?? ctx.currentPlayer ?? '0';
    const mySupplyId = `${zoneNames.PersonalSupply}:${myPid}`;

    const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const stagingZoneId = `staging_${myPid}`;
    const stagedTileId = (G.zones[stagingZoneId]?.items[0]) || null;
    const vm = useIntentViewModel({ G, ctx, playerID: myPid, selectedTileId, stagedTileId });

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

    const isInteractive = isActive && !vm.hasPendingChoice;

    const pendingTile = useMemo(() => {
        // 1. Staged tile (Normal draw & place)
        if (stagedTileId && G.tiles[stagedTileId]) {
            return G.tiles[stagedTileId];
        }

        // 2. Pending choice (if it involves placing a tile)
        if (vm.hasPendingChoice) {
            // Try to find tile in pending choice
            const pending = (G.engine as any).pendingChoice;
            // Common patterns for pending choice payload: { tile: {...} } or { tileId: "..." }
            if (pending?.tile && typeof pending.tile === 'object') {
                return pending.tile;
            }
            if (pending?.tileId && G.tiles[pending.tileId]) {
                return G.tiles[pending.tileId];
            }
            if (pending?.payload?.tile && typeof pending.payload.tile === 'object') {
                return pending.payload.tile;
            }
            if (pending?.payload?.tileId && G.tiles[pending.payload.tileId]) {
                return G.tiles[pending.payload.tileId];
            }
        }
        return null;
    }, [G, stagedTileId, vm.hasPendingChoice]);

    const placementIntents = useMemo(() => {
        if (vm.hasPendingChoice) {
             // Filter resolveChoice intents that are spatial
             return vm.pendingChoice.resolveChoice.filter(intent => {
                 const sel = (intent.payload as any)?.selection;
                 return typeof sel === 'string' && /^-?\d+,-?\d+$/.test(sel);
             });
        }
        return vm.drawAndPlace.placeTile;
    }, [vm.hasPendingChoice, vm.pendingChoice.resolveChoice, vm.drawAndPlace.placeTile]);

    const placementGhostCoords = useMemo(() => {
        if (vm.hasPendingChoice && placementIntents.length > 0) {
            return placementIntents.map(i => (i.payload as any).selection as string);
        }
        return vm.ghostCoords;
    }, [vm.hasPendingChoice, placementIntents, vm.ghostCoords]);

    const isBoardInteractive = isActive && (!vm.hasPendingChoice || placementIntents.length > 0);

    return (
        <div className="game-layout">
            <PublicNoticeOverlay G={G} />
            <PendingChoiceModal resolveChoiceIntents={vm.pendingChoice.resolveChoice} moves={moves} />

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
            <main className="center-panel glass-panel" style={{ position: 'relative' }}>
                <h3>Board</h3>
                {pendingTile && (
                    <div className="tile-placement-hud" style={{
                        position: 'absolute',
                        top: '50px',
                        left: '20px',
                        zIndex: 100,
                        background: 'rgba(20, 20, 30, 0.95)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #444)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                            <ResortIcon resort={pendingTile.resort} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>
                                {pendingTile.resort} {pendingTile.weight ? `W${pendingTile.weight}` : ''}
                            </span>
                            <span style={{ fontSize: '0.8em', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {pendingTile.type}
                            </span>
                        </div>
                    </div>
                )}
                <BoardViewport
                    G={G}
                    moves={moves}
                    placeTileIntents={placementIntents}
                    ghostCoords={placementGhostCoords}
                    isInteractive={isBoardInteractive}
                    selectedTileId={selectedTileId}
                    selectedCoord={selectedCoord}
                    onSelectTile={handleSelectTile}
                    pendingTile={pendingTile}
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
                <div className="zone draw-bag-widget" data-testid="draw-bag-widget">
                    <h4 className="zone-title">Draw Bag</h4>
                    <div className="draw-bag-count" data-testid="draw-bag-count">
                        {G.zones[zoneNames.DrawPile]?.items.length ?? 0}
                    </div>
                </div>
                <Zone zoneId={zoneNames.DiscardFaceUp} G={G} title="Discard (Face Up)" />
                <Zone zoneId={zoneNames.Noise} G={G} title="Noise" />
            </aside>

            {/* Bottom Controls */}
            {!vm.hasPendingChoice && (
                <div className="controls-container glass-panel">
                    <ActionPanel
                        moves={moves}
                        isActive={isActive}
                        vm={vm}
                    />
                </div>
            )}
        </div>
    );
};
