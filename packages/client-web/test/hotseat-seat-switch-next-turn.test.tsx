import { renderHook, act } from '@testing-library/react';
import { useGameInteractionController } from '../src/ui/interaction/useGameInteractionController';
import { useIntentViewModel } from '../src/ui/useIntentViewModel';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../src/ui/useIntentViewModel', () => ({
    useIntentViewModel: vi.fn()
}));

const mockDefaultVM = {
    stage: 'politicalAction',
    intents: [],
    hasPendingChoice: false,
    political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
    drawAndPlace: { placeTile: [] }
};

describe('useGameInteractionController Hotseat Switching', () => {
    beforeEach(() => {
        vi.mocked(useIntentViewModel).mockReturnValue(mockDefaultVM);
    });

    it('does not force-reset transient selection state when playerID changes', () => {
        const { result, rerender } = renderHook(
            (props) => useGameInteractionController(props),
            {
                initialProps: {
                    G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
                    ctx: { currentPlayer: '0' },
                    playerID: '0',
                    moves: {}
                }
            }
        );

        // 1. P0 sets some state
        act(() => {
            result.current.setActionMode('placeInfluence');
            result.current.selectMoveInfluenceSource('tile_123');
        });

        expect(result.current.actionMode).toBe('placeInfluence');
        expect(result.current.moveInfluenceSourceId).toBe('tile_123');

        // 2. Switch to P1
        rerender({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '1' },
            playerID: '1',
            moves: {}
        });

        // 3. Assert state is preserved; draft legality is revalidated separately.
        expect(result.current.actionMode).toBe('placeInfluence');
        expect(result.current.moveInfluenceSourceId).toBe('tile_123');
    });

    it('updates stale closures when isHardGate changes across seats', () => {
        // Scenario:
        // P0 is in Hard Gate (hasPendingChoice = true).
        // selectTile callback captures isHardGate = true.
        // Switch to P1 (hasPendingChoice = false).
        // selectTile should now see isHardGate = false.
        
        // 1. Start with P0 in Hard Gate
        vi.mocked(useIntentViewModel).mockReturnValue({
            ...mockDefaultVM,
            hasPendingChoice: true
        });

        const { result, rerender } = renderHook(
            (props) => useGameInteractionController(props),
            {
                initialProps: {
                    G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
                    ctx: { currentPlayer: '0' },
                    playerID: '0',
                    moves: {}
                }
            }
        );

        // Verify P0 is blocked
        expect(result.current.interactionState).toBe('pendingChoiceHardGate');
        act(() => {
            result.current.setActionMode('placeInfluence');
        });
        expect(result.current.actionMode).toBe('none'); // Blocked

        // 2. Switch to P1, NOT in Hard Gate
        vi.mocked(useIntentViewModel).mockReturnValue({
            ...mockDefaultVM,
            hasPendingChoice: false
        });

        rerender({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '1' },
            playerID: '1',
            moves: {}
        });

        // Verify P1 is NOT blocked
        // If the closure is stale, this will fail (it will still think isHardGate=true)
        act(() => {
            result.current.setActionMode('placeInfluence');
        });

        expect(result.current.actionMode).toBe('placeInfluence');
    });
});
