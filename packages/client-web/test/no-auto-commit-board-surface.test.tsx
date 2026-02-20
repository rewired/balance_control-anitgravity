
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import type { LegalIntent } from '@balance-control/game';

// Mock the game package to control enumerateLegalIntents
vi.mock('@balance-control/game', async () => {
    return {
        enumerateLegalIntents: vi.fn(),
    };
});

// Import the mocked function so we can control it
import { enumerateLegalIntents } from '@balance-control/game';
import { GameLayout } from '../src/components/GameLayout';

// Polyfill ResizeObserver for react-zoom-pan-pinch
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const mockEnumerateLegalIntents = enumerateLegalIntents as any;

describe('No Auto-Commit Board Surface', () => {
    const mockMoves = {
        placeTile: vi.fn(),
        passTilePlacement: vi.fn(),
    };

    const mockCtx = {
        currentPlayer: '0',
        activePlayers: { '0': 'drawAndPlace' }, // Default stage
        numPlayers: 2,
    };

    // Minimal G satisfying GameLayout requirements
    const mockG = {
        grid: {},
        tiles: {
            't1': { id: 't1', type: 'Resort', resort: 'ECO' }
        },
        zones: {
            'staging_0': { items: ['t1'] },
            'DrawPile': { items: [] },
            'DiscardFaceUp': { items: [] },
            'Noise': { items: [] },
            'PersonalSupply:0': { items: [] },
            'Bank': { items: [] },
        },
        objects: {},
        engine: {
            pendingChoice: null
        }
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnumerateLegalIntents.mockReturnValue([]);
    });

    it('Ghost placement is draft-only (does not commit immediately)', () => {
        // Setup: enumerateLegalIntents returns a placeTile intent
        const placeIntent: LegalIntent = {
            moveType: 'placeTile',
            payload: { targetCoord: '0,0', tileId: 't1' }
        };
        mockEnumerateLegalIntents.mockReturnValue([placeIntent]);

        render(
            <GameLayout
                G={mockG}
                ctx={mockCtx}
                moves={mockMoves}
                playerID="0"
                isActive={true}
            />
        );

        // 1. Find the ghost tile
        // HexBoard typically renders ghosts with a class or testid
        // Assuming testid="hex-ghost-0_0" based on typical HexBoard patterns
        const ghosts = screen.getAllByTestId('hex-ghost-0_0');
        expect(ghosts.length).toBeGreaterThan(0);
        const ghost = ghosts[0];

        // 2. Click ghost
        fireEvent.click(ghost);

        // 3. Assert moves.placeTile NOT called
        expect(mockMoves.placeTile).not.toHaveBeenCalled();

        // 4. Assert Confirm button appears
        const confirmBtn = screen.getByTestId('btn-confirm-draft');
        expect(confirmBtn).toBeDefined();

        // 5. Click Confirm
        fireEvent.click(confirmBtn);

        // 6. Assert moves.placeTile called exactly once
        expect(mockMoves.placeTile).toHaveBeenCalledTimes(1);
        expect(mockMoves.placeTile).toHaveBeenCalledWith(placeIntent.payload);
    });

    it('Skip placement is draft-only (does not commit immediately)', () => {
        // Setup: enumerateLegalIntents returns passTilePlacement
        const passIntent: LegalIntent = {
            moveType: 'passTilePlacement',
            payload: {}
        };
        mockEnumerateLegalIntents.mockReturnValue([passIntent]);

        render(
            <GameLayout
                G={mockG}
                ctx={mockCtx}
                moves={mockMoves}
                playerID="0"
                isActive={true}
            />
        );

        // 1. Find Skip Placement button
        const skipBtn = screen.getByTestId('btn-skip-placement');
        expect(skipBtn).toBeDefined();

        // 2. Click Skip
        fireEvent.click(skipBtn);

        // 3. Assert moves.passTilePlacement NOT called
        expect(mockMoves.passTilePlacement).not.toHaveBeenCalled();

        // 4. Assert Confirm button appears
        const confirmBtn = screen.getByTestId('btn-confirm-draft');
        expect(confirmBtn).toBeDefined();

        // 5. Click Confirm
        fireEvent.click(confirmBtn);

        // 6. Assert moves.passTilePlacement called exactly once
        expect(mockMoves.passTilePlacement).toHaveBeenCalledTimes(1);
        expect(mockMoves.passTilePlacement).toHaveBeenCalledWith(passIntent.payload);
    });

    it('While draftReady, further board clicks do not change which intent is confirmed', () => {
        // Setup: Two placeTile intents
        const placeIntent1: LegalIntent = {
            moveType: 'placeTile',
            payload: { targetCoord: '0,0', tileId: 't1' }
        };
        const placeIntent2: LegalIntent = {
            moveType: 'placeTile',
            payload: { targetCoord: '0,1', tileId: 't1' }
        };
        mockEnumerateLegalIntents.mockReturnValue([placeIntent1, placeIntent2]);

        render(
            <GameLayout
                G={mockG}
                ctx={mockCtx}
                moves={mockMoves}
                playerID="0"
                isActive={true}
            />
        );

        // 1. Click first ghost (0,0)
        // Note: Use getAllByTestId because in some test environments ghosts might appear duplicated (likely due to transform wrapper)
        const ghost1 = screen.getAllByTestId('hex-ghost-0_0')[0];
        fireEvent.click(ghost1);

        // 2. Verify draft is set for 0,0 (ActionDock shows it)
        // Since we don't inspect ActionDock text deeply, we can verify confirm button is there
        const confirmBtn = screen.getByTestId('btn-confirm-draft');
        expect(confirmBtn).toBeDefined();

        // 3. Click second ghost (0,1)
        const ghost2 = screen.getAllByTestId('hex-ghost-0_1')[0];
        fireEvent.click(ghost2);

        // 4. Click Confirm
        fireEvent.click(confirmBtn);

        // 5. Assert moves.placeTile called with FIRST payload (0,0), not second
        expect(mockMoves.placeTile).toHaveBeenCalledTimes(1);
        expect(mockMoves.placeTile).toHaveBeenCalledWith(placeIntent1.payload);
    });
});
