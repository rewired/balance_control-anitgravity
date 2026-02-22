import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { GameLayout } from '../src/components/GameLayout';
import { I18nProvider } from '../src/ui/i18n';

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

// Mock BoardViewport to avoid rendering complex board logic
vi.mock('../src/components/BoardViewport', () => ({
    BoardViewport: () => <div data-testid="board-viewport" />
}));

// Mock useGameInteractionController to avoid engine logic
vi.mock('../src/ui/interaction/useGameInteractionController', () => ({
    useGameInteractionController: () => ({
        vm: {
            hasPendingChoice: false,
            intents: [],
            drawAndPlace: { placeTile: [] },
            pendingChoice: { resolveChoice: [] },
            political: { formalizeInfluence: [], convertResources: [], measures: [], others: [] },
            ghostCoords: []
        },
        selectedTileId: null,
        selectedCoord: null,
        selectTile: vi.fn(),
        selectMoveInfluenceSource: vi.fn(),
        proposeIntent: vi.fn(),
        actionMode: 'none',
        moveInfluenceSourceId: null,
        interactionState: 'selectingAction',
        draft: { intent: null },
        resolveChoice: vi.fn(),
    })
}));

const createState = () => {
    return {
        zones: {
            'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PersonalSupply', items: [] },
            'PersonalSupply:1': { id: 'PersonalSupply:1', name: 'PersonalSupply', items: [] },
            Bank: { id: 'Bank', name: 'Bank', items: [] },
            Board: { id: 'Board', name: 'Board', items: [] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: [] },
            DiscardFaceUp: { id: 'DiscardFaceUp', name: 'DiscardFaceUp', items: [] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
        },
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = {
    currentPlayer: '0',
    activePlayers: { '0': 'politicalAction' }, // Ensure ActionDock renders (not in setup)
    playOrder: ['0', '1']
};

afterEach(() => {
    cleanup();
});

describe('Dock Layout', () => {
    it('renders ActionDock outside the center panel', () => {
        ensureResizeObserver();
        const { container } = render(
            <I18nProvider>
                <GameLayout
                    G={createState()}
                    ctx={baseCtx}
                    moves={{}}
                    playerID={'0'}
                    isActive={true}
                />
            </I18nProvider>
        );

        const centerPanel = container.querySelector('.center-panel');
        // We look for .controls-container because ActionDock is wrapped in it
        const controlsContainer = container.querySelector('.controls-container');
        
        expect(centerPanel).not.toBeNull();
        expect(controlsContainer).not.toBeNull();

        // Check if controlsContainer is NOT inside centerPanel
        expect(centerPanel?.contains(controlsContainer)).toBe(false);

        // Check if both are children of game-layout (optional but good)
        const gameLayout = container.querySelector('.game-layout');
        expect(gameLayout?.contains(centerPanel)).toBe(true);
        expect(gameLayout?.contains(controlsContainer)).toBe(true);
    });
});
