import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { GameLayout } from '../src/components/GameLayout';
// We need to mock useT hook from ../src/ui/i18n
// Since GameLayout uses it, and we want to avoid complex context setup if possible.
// But GameLayout imports useT directly.
// The dock-layout.test.tsx uses I18nProvider, let's stick with that.
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

// Mock useGameInteractionController
vi.mock('../src/ui/interaction/useGameInteractionController', () => ({
    useGameInteractionController: () => ({
        vm: {
            stage: 'politicalAction',
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
    activePlayers: { '0': 'politicalAction' },
    playOrder: ['0', '1']
};

afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
});

beforeEach(() => {
    ensureResizeObserver();
});

describe('Dock Toggles', () => {
    it('panels are collapsed by default', () => {
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

        const gameLayout = container.querySelector('.game-layout') as HTMLElement;
        expect(gameLayout.style.gridTemplateColumns).toBe('0px 1fr 0px');

        const leftPanel = container.querySelector('.left-panel') as HTMLElement;
        expect(leftPanel.style.display).toBe('none');

        const rightPanel = container.querySelector('.right-panel') as HTMLElement;
        expect(rightPanel.style.display).toBe('none');
    });

    it('toggles expand and collapse panels', () => {
        render(
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

        const leftToggle = screen.getByTestId('toggle-left-panel');
        const rightToggle = screen.getByTestId('toggle-right-panel');

        // Expand Left
        fireEvent.click(leftToggle);
        const gameLayout = document.querySelector('.game-layout') as HTMLElement;
        expect(gameLayout.style.gridTemplateColumns).toBe('280px 1fr 0px');
        const leftPanel = document.querySelector('.left-panel') as HTMLElement;
        expect(leftPanel.style.display).toBe('flex');

        // Expand Right
        fireEvent.click(rightToggle);
        expect(gameLayout.style.gridTemplateColumns).toBe('280px 1fr 280px');
        const rightPanel = document.querySelector('.right-panel') as HTMLElement;
        expect(rightPanel.style.display).toBe('flex');

        // Collapse Left
        fireEvent.click(leftToggle);
        expect(gameLayout.style.gridTemplateColumns).toBe('0px 1fr 280px');
        expect(leftPanel.style.display).toBe('none');
    });

    it('persists state to localStorage', () => {
        const { unmount } = render(
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

        // Default: closed
        expect(localStorage.getItem('bc_ui_showLeftPanel')).toBeNull(); // or 'false' depending on impl, but initial read returns false if null

        // Expand Left
        fireEvent.click(screen.getByTestId('toggle-left-panel'));
        expect(localStorage.getItem('bc_ui_showLeftPanel')).toBe('true');

        unmount();

        // Re-render, should be open
        render(
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

        const gameLayout = document.querySelector('.game-layout') as HTMLElement;
        expect(gameLayout.style.gridTemplateColumns).toBe('280px 1fr 0px');
    });
});
