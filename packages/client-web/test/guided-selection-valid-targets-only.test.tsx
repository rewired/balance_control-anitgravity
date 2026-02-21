import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';
import { I18nProvider } from '../src/ui/i18n';

// Mock @balance-control/game to return controlled legal intents
vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<any>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: vi.fn()
    };
});

import { enumerateLegalIntents } from '@balance-control/game';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

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

const createState = () => {
    return {
        zones: {
            tile_alpha: { id: 'tile_alpha', name: 'Tile', items: ['inf_1'] },
            tile_beta: { id: 'tile_beta', name: 'Tile', items: [] },
            tile_gamma: { id: 'tile_gamma', name: 'Tile', items: [] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: TileType.Resort, resort: 'FOR', weight: 3 },
            tile_beta: { id: 'tile_beta', type: TileType.Resort, resort: 'DOM', weight: 2 },
            tile_gamma: { id: 'tile_gamma', type: TileType.Resort, resort: 'SEC', weight: 1 }
        },
        objects: {
            inf_1: { id: 'inf_1', type: 'Influence', owner: 'player-0' }
        },
        adjacency: {},
        grid: { '0,0': 'tile_alpha', '0,1': 'tile_beta', '1,0': 'tile_gamma' },
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'politicalAction' } };

describe('Guided selection - valid targets only', () => {
    it('does not select invalid source in MoveInfluence mode', () => {
        ensureResizeObserver();
        const G = createState();

        // Mock legal intents: Only moving from alpha to beta is legal
        (enumerateLegalIntents as any).mockReturnValue([
            {
                moveType: 'moveInfluence',
                payload: { sourceId: 'tile_alpha', targetId: 'tile_beta' }
            }
        ]);

        render(
            <I18nProvider>
                <GameLayout
                    G={G}
                    ctx={baseCtx}
                    moves={{}}
                    playerID={'0'}
                    isActive={true}
                />
            </I18nProvider>
        );

        // 1. Enter Move Influence mode
        const moveInfluenceBtn = screen.getByTestId('btn-mode-move-influence');
        fireEvent.click(moveInfluenceBtn);

        // Check initial hint
        expect(screen.getAllByText(/Select source/).length).toBeGreaterThan(0);

        // 2. Click INVALID tile (tile_gamma)
        const tileGamma = screen.getByTestId('hex-tile-1_0');
        fireEvent.click(tileGamma);

        // Expect:
        // - Hint still says "Select source" (meaning moveInfluenceSourceId is still null)
        // - Inspector shows tile_gamma (meaning inspection still works)
        expect(screen.getAllByText(/Select source/).length).toBeGreaterThan(0);
        expect(screen.getByTestId('inspector-coord').textContent).toBe('1,0');

        // 3. Click VALID source tile (tile_alpha)
        const tileAlpha = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tileAlpha);

        // Expect:
        // - Hint changes to "Select destination" (meaning moveInfluenceSourceId is set)
        expect(screen.getAllByText(/Select destination/).length).toBeGreaterThan(0);
        expect(screen.getByTestId('inspector-coord').textContent).toBe('0,0');
    });
});
