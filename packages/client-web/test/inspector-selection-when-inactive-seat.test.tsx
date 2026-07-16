// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { GameLayout } from '../src/components/GameLayout';
import { I18nProvider } from '../src/ui/i18n';
import { useIntentViewModel } from '../src/ui/useIntentViewModel';

// Mock dependencies
vi.mock('@balance-control/game', async () => {
    return {
        enumerateLegalIntents: () => []
    };
});
vi.mock('@balance-control/core', async () => {
    return {
        selectTileController: () => null
    };
});

// Mock the hook directly to control VM state
vi.mock('../src/ui/useIntentViewModel', () => ({
    useIntentViewModel: vi.fn()
}));

// Mock ResizeObserver
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

afterEach(() => {
    cleanup();
});

const createState = (overrides = {}) => ({
    tiles: {
        'tile_1': { id: 'tile_1', type: 'Resort', resort: 'DOM', weight: 1 }
    },
    grid: { '0,0': 'tile_1' },
    zones: {
        'tile_1': { id: 'tile_1', items: [] },
        'staging_0': { id: 'staging_0', items: [] },
        'staging_1': { id: 'staging_1', items: [] }
    },
    objects: {},
    engine: {
        idSeq: 1,
        effectQueue: [],
        activeModifiers: [],
        history: [],
        attributes: {}
    },
    ...overrides
} as any);

const defaultVM = {
    stage: 'mockStage',
    hasPendingChoice: false,
    pendingChoice: { kind: 'none', resolveChoice: [] },
    intents: [],
    ghostCoords: [],
    stagedTileId: null,
    drawAndPlace: { placeTile: [] },
    political: { formalizeInfluence: [], convertResources: [] }
};

describe('Inspector Selection Consistency', () => {
    beforeEach(() => {
        (useIntentViewModel as any).mockReturnValue(defaultVM);
    });

    it('allows selecting a tile when isActive is false (inactive seat)', () => {
        ensureResizeObserver();
        const G = createState();
        const ctx = { currentPlayer: '1', activePlayers: { '1': 'drawAndPlace' } }; // Local is '0'
        
        render(
            <I18nProvider>
                <GameLayout
                    G={G}
                    ctx={ctx}
                    moves={{}}
                    playerID="0"
                    isActive={false} // Inactive seat
                />
            </I18nProvider>
        );

        const tile = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tile);

        // Inspector should show the tile details
        expect(screen.getByTestId('inspector-coord').textContent).toBe('0,0');
        expect(screen.queryByTestId('inspector-empty')).toBeNull();
    });

    it('disables inspection when PendingChoice (Hard-Gate) is active', () => {
        ensureResizeObserver();
        
        // Mock VM to simulate hard gate
        (useIntentViewModel as any).mockReturnValue({
            ...defaultVM,
            hasPendingChoice: true,
            pendingChoice: { kind: 'someChoice', resolveChoice: [] }
        });

        const G = createState();
        const ctx = { currentPlayer: '0', activePlayers: { '0': 'someStage' } };
        
        render(
            <I18nProvider>
                <GameLayout
                    G={G}
                    ctx={ctx}
                    moves={{}}
                    playerID="0"
                    isActive={true} 
                />
            </I18nProvider>
        );

        const tile = screen.getByTestId('hex-tile-0_0');
        fireEvent.click(tile);

        // Inspector should NOT update (remain empty)
        expect(screen.queryByTestId('inspector-empty')).not.toBeNull();
        expect(screen.queryByTestId('inspector-coord')).toBeNull();
    });
});
