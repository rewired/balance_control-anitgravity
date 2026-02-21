import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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

const createState = () => {
    return {
        zones: {
            'PersonalSupply:0': { id: 'PersonalSupply:0', name: 'PersonalSupply', items: ['res_dom_1', 'res_dom_2', 'inf_1'] },
            'PersonalSupply:1': { id: 'PersonalSupply:1', name: 'PersonalSupply', items: ['res_for_1', 'inf_2', 'inf_3'] },
            Bank: { id: 'Bank', name: 'Bank', items: [] },
            Board: { id: 'Board', name: 'Board', items: [] },
            DrawPile: { id: 'DrawPile', name: 'DrawPile', items: [] },
            DiscardFaceUp: { id: 'DiscardFaceUp', name: 'DiscardFaceUp', items: [] },
            Noise: { id: 'Noise', name: 'Noise', items: [] },
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {},
        objects: {
            res_dom_1: { id: 'res_dom_1', type: 'Resource', resort: 'DOM' },
            res_dom_2: { id: 'res_dom_2', type: 'Resource', resort: 'DOM' },
            inf_1: { id: 'inf_1', type: 'Influence', owner: '0' },
            res_for_1: { id: 'res_for_1', type: 'Resource', resort: 'FOR' },
            inf_2: { id: 'inf_2', type: 'Influence', owner: '1' },
            inf_3: { id: 'inf_3', type: 'Influence', owner: '1' },
        },
        adjacency: {},
        grid: {},
        engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} }
    } as any;
};

const baseCtx = {
    currentPlayer: '0',
    activePlayers: { '0': 'drawAndPlace' },
    playOrder: ['0', '1']
};

describe('Player Resources UI', () => {
    it('renders resources for all players', () => {
        ensureResizeObserver();
        render(
            <I18nProvider>
                <GameLayout
                    G={createState()}
                    ctx={baseCtx}
                    moves={{}}
                    playerID={'0'}
                    isActive={false}
                />
            </I18nProvider>
        );

        // Check Player 0
        const p0Row = screen.getByTestId('player-resources-0');
        expect(p0Row).toBeDefined();

        // P0 has 1 Influence (count 1) and 2 DOM
        // We can check if DOM icon is rendered. ResortIcon uses image with href.
        // Or check text content for counts.

        // Check Player 1
        const p1Row = screen.getByTestId('player-resources-1');
        expect(p1Row).toBeDefined();

        // P1 has 2 Influence and 1 FOR
    });

    it('highlights active player', () => {
        ensureResizeObserver();
        const ctx = { ...baseCtx, currentPlayer: '1' };
        render(
            <I18nProvider>
                <GameLayout
                    G={createState()}
                    ctx={ctx}
                    moves={{}}
                    playerID={'0'}
                    isActive={false}
                />
            </I18nProvider>
        );

        const p1Row = screen.getByTestId('player-resources-1');
        expect(p1Row.className).toContain('active');

        const p0Row = screen.getByTestId('player-resources-0');
        expect(p0Row.className).not.toContain('active');
    });
});
