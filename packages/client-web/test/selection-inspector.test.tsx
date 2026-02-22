// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { TileType } from '@balance-control/rules';
import { GameLayout } from '../src/components/GameLayout';
import { InspectorActionStatus } from '../src/components/InspectorActionStatus';
import { I18nProvider } from '../src/ui/i18n';

vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<any>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: () => []
    };
});

afterEach(() => {
    cleanup();
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
            tile_alpha: { id: 'tile_alpha', name: 'Tile', items: ['inf_1', 'inf_2', 'inf_3', 'res_1', 'res_2'] }
        },
        tiles: {
            tile_alpha: { id: 'tile_alpha', type: TileType.Resort, resort: 'FOR', weight: 3 }
        },
        objects: {
            inf_1: { id: 'inf_1', type: 'Influence', owner: 'player-0' },
            inf_2: { id: 'inf_2', type: 'Influence', owner: 'player-0' },
            inf_3: { id: 'inf_3', type: 'Influence', owner: 'player-1' },
            res_1: { id: 'res_1', type: 'Resource', resort: 'DOM' },
            res_2: { id: 'res_2', type: 'Resource', resort: 'INF' }
        },
        adjacency: {},
        grid: { '0,0': 'tile_alpha' },
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = { currentPlayer: '0', activePlayers: { '0': 'drawAndPlace' } };

describe('Selection inspector', () => {
    it('updates inspector content when clicking an occupied tile', () => {
        ensureResizeObserver();
        const G = createState();
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

        const tileCell = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tileCell);

        const coordValue = screen.getByTestId('inspector-coord');
        expect(coordValue.textContent).toBe('0,0');

        const panel = screen.getByTestId('inspector-panel');
        expect(panel.textContent).toContain('player-0');

        const ownerLabel = screen.getByText('player-0');
        const ownerCount = ownerLabel.closest('.inspector-row')?.querySelector('.inspector-value');
        expect(ownerCount?.textContent).toBe('2');

        const resourceLabel = screen.getByText('DOM');
        const resourceCount = resourceLabel.closest('.inspector-row')?.querySelector('.inspector-value');
        expect(resourceCount?.textContent).toBe('1');
    });

    it('clears selection and inspector on Escape', () => {
        ensureResizeObserver();
        const G = createState();
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

        const tileCell = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tileCell);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByTestId('inspector-empty')).not.toBeNull();
    });

    it('renders action status block in GameLayout', () => {
        ensureResizeObserver();
        const G = createState();
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
        const statusBlock = screen.getByTestId('inspector-action-status');
        expect(statusBlock).toBeDefined();

        // Labels from i18n (use within to avoid collision with ActionDock)
        expect(within(statusBlock).getByText('Active action')).toBeDefined();
        expect(within(statusBlock).getByTestId('inspector-active-action').textContent).toBe('None');
    });

    it('displays pinned source when moveInfluenceSourceId is set', () => {
        const mockController: any = {
            actionMode: 'moveInfluence',
            interactionState: 'selectingParams',
            moveInfluenceSourceId: 'tile_123',
            pinnedCommitteeTileId: null,
            pinnedGrassrootsTileId: null,
            vm: { hasPendingChoice: false }
        };

        render(
            <I18nProvider>
                <InspectorActionStatus controller={mockController} />
            </I18nProvider>
        );

        expect(screen.getByText('Move influence')).toBeDefined();
        expect(screen.getByText('Pinned source')).toBeDefined();
        expect(screen.getByText('tile_123')).toBeDefined();
    });
});
