import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GameLayout } from '../src/components/GameLayout';
import { I18nProvider } from '../src/ui/i18n';

// Mock engine
const mockEnumerateLegalIntents = vi.fn();
vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<any>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: (...args: any[]) => mockEnumerateLegalIntents(...args)
    };
});

afterEach(() => {
    cleanup();
    mockEnumerateLegalIntents.mockReset();
});

// Polyfill ResizeObserver
class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}
const ensureResizeObserver = () => {
    if (!('ResizeObserver' in window)) {
        (window as any).ResizeObserver = ResizeObserverMock;
    }
};

const createState = (pendingChoice: any = null) => {
    return {
        zones: {
            'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PS', items: [] },
            Bank: { id: 'Bank', name: 'Bank', items: [] },
            Board: { id: 'Board', name: 'Board', items: ['tile_alpha', 'tile_beta'] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: [] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            DiscardFaceUp: { id: 'DiscardFaceUp', name: 'Discard', items: [] },
            tile_alpha: { id: 'tile_alpha', name: 'Tile Alpha', items: [] },
            tile_beta: { id: 'tile_beta', name: 'Tile Beta', items: [] },
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: 'Resort', resort: 'FOR', weight: 2 },
            tile_beta: { id: 'tile_beta', type: 'Resort', resort: 'DOM', weight: 1 }
        },
        objects: {},
        adjacency: {},
        grid: { '0,0': 'tile_alpha', '1,0': 'tile_beta' },
        engine: { 
            idSeq: 0, 
            effectQueue: [], 
            activeModifiers: [], 
            history: [], 
            attributes: {},
            pendingChoice
        }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'resolveChoice' } };

describe('PendingChoice Hard-Gate Regression', () => {
    
    describe('Invariant: Non-selectTile (Modal Mode)', () => {
        it('disables board interaction completely (no inspect, no rogue moves)', () => {
            ensureResizeObserver();
            const state = createState({
                kind: 'selectOption',
                resolveChoice: [
                    { moveType: 'resolveChoice', payload: { choiceId: 'c1', selection: 'A' } }
                ]
            });

            // Mock returns legal intent for resolveChoice AND a rogue placeTile intent
            mockEnumerateLegalIntents.mockReturnValue([
                ...state.engine.pendingChoice.resolveChoice,
                { moveType: 'placeTile', payload: { targetCoord: '0,1', tileId: 't1' } }
            ]);

            const resolveChoice = vi.fn();
            const placeTile = vi.fn();

            render(
                <I18nProvider>
                    <GameLayout
                        G={state}
                        ctx={baseCtx}
                        moves={{ resolveChoice, placeTile }}
                        playerID={'0'}
                        isActive={true}
                    />
                </I18nProvider>
            );

            // 1. Verify Modal is present
            expect(screen.getByTestId('pending-choice-overlay')).not.toBeNull();

            // 2. Verify Board is NOT interactive
            // Clicking a tile (tile_alpha) should NOT select it (Inspector empty)
            const tile = screen.getByTestId('hex-tile-0_0');
            fireEvent.click(tile);
            expect(screen.getByTestId('inspector-empty')).not.toBeNull();
            expect(screen.queryByTestId('inspector-coord')).toBeNull();

            // 3. Verify rogue placeTile intent is ignored (no ghost should be clickable/active)
            // Ideally it shouldn't be rendered, but if it is, it shouldn't be clickable.
            // Check if ghost exists
            const ghost = screen.queryByTestId('hex-ghost-0_1');
            if (ghost) {
                // If it exists, it must be disabled or not fire
                fireEvent.click(ghost);
                expect(placeTile).not.toHaveBeenCalled();
            }
        });
    });

    describe('Invariant: selectTile (Board Mode)', () => {
        it('disables inspection (click on non-target does nothing)', () => {
            ensureResizeObserver();
            const state = createState({
                kind: 'selectTile',
                resolveChoice: [
                    { moveType: 'resolveChoice', payload: { choiceId: 'c1', selection: 'tile_alpha' } }
                ]
            });

            mockEnumerateLegalIntents.mockReturnValue(state.engine.pendingChoice.resolveChoice);

            const resolveChoice = vi.fn();

            render(
                <I18nProvider>
                    <GameLayout
                        G={state}
                        ctx={baseCtx}
                        moves={{ resolveChoice }}
                        playerID={'0'}
                        isActive={true}
                    />
                </I18nProvider>
            );

            // 1. Verify Modal is NOT present
            expect(screen.queryByTestId('pending-choice-overlay')).toBeNull();

            // 2. Click non-target (tile_beta)
            const tileBeta = screen.getByTestId('hex-tile-1_0');
            fireEvent.click(tileBeta);

            // 3. Verify Inspector did NOT update
            expect(screen.getByTestId('inspector-empty')).not.toBeNull();
            expect(screen.queryByTestId('inspector-coord')).toBeNull();
        });

        it('dispatches resolveChoice immediately on target click', () => {
            ensureResizeObserver();
            const state = createState({
                kind: 'selectTile',
                resolveChoice: [
                    { moveType: 'resolveChoice', payload: { choiceId: 'c1', selection: 'tile_alpha' } }
                ]
            });

            mockEnumerateLegalIntents.mockReturnValue(state.engine.pendingChoice.resolveChoice);

            const resolveChoice = vi.fn();

            render(
                <I18nProvider>
                    <GameLayout
                        G={state}
                        ctx={baseCtx}
                        moves={{ resolveChoice }}
                        playerID={'0'}
                        isActive={true}
                    />
                </I18nProvider>
            );

            // 1. Click target (tile_alpha)
            const tileAlpha = screen.getByTestId('hex-tile-0_0');
            fireEvent.click(tileAlpha);

            // 2. Verify immediate dispatch
            expect(resolveChoice).toHaveBeenCalledTimes(1);
            expect(resolveChoice).toHaveBeenCalledWith({ choiceId: 'c1', selection: 'tile_alpha' });
        });
    });
});
