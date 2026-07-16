
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { GameLayout } from '../src/components/GameLayout';
import { I18nProvider } from '../src/ui/i18n';
import '../src/game';

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
    activePlayers: { '0': 'drawAndPlace' },
    playOrder: ['0', '1']
};

afterEach(() => {
    cleanup();
});

describe('Layout Panels (Sidebar)', () => {
    it('renders Players widget', () => {
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

        // Check for "Players" header
        expect(screen.getByText('Players')).toBeDefined();
        // Check for player rows
        expect(screen.getByTestId('player-resources-0')).toBeDefined();
        expect(screen.getByTestId('player-resources-1')).toBeDefined();
    });

    it('does NOT render Bank widget', () => {
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

        // Should not find "Bank" text associated with a zone title
        // Note: We might need to be specific if "Bank" appears elsewhere, but usually Zone title is h4 or similar.
        // The Zone component renders a title.
        const bankTitle = screen.queryByText('Bank');
        
        // If it exists, check if it's the Zone title.
        // In current implementation, <Zone title="Bank"> renders <h4>Bank</h4>
        if (bankTitle) {
            // It might be a text node, check if it's in the document.
            // We expect it to be NULL after the change.
            // For now (before change), this test should FAIL.
            // But to be safe and robust, let's assert it is null.
             expect(bankTitle).toBeNull();
        } else {
            expect(bankTitle).toBeNull();
        }
    });
});
