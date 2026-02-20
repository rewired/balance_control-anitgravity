import { renderHook, act } from '@testing-library/react';
import { useGameInteractionController } from '../src/ui/interaction/useGameInteractionController';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/ui/useIntentViewModel', () => ({
    useIntentViewModel: vi.fn(() => ({
        stage: 'politicalAction',
        intents: [],
        political: { others: [], formalizeInfluence: [], convertResources: [], measures: [] },
        drawAndPlace: { placeTile: [] }
    }))
}));

describe('useGameInteractionController State Machine', () => {
    it('initial state is selectingAction', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        expect(result.current.interactionState).toBe('selectingAction');
    });

    it('transitions to selectingParams when actionMode is set', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        act(() => {
            result.current.setActionMode('placeInfluence');
        });

        expect(result.current.interactionState).toBe('selectingParams');
    });

    it('transitions to draftReady when intent is proposed', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        act(() => {
            result.current.proposeIntent({ moveType: 'placeInfluence', payload: {} } as any);
        });

        expect(result.current.interactionState).toBe('draftReady');
    });

    it('blocks new proposals when draftReady', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        act(() => {
            result.current.proposeIntent({ moveType: 'placeInfluence', payload: { id: 1 } } as any);
        });
        expect(result.current.interactionState).toBe('draftReady');
        expect(result.current.proposedIntent?.payload).toEqual({ id: 1 });

        // Try to propose another intent
        act(() => {
            result.current.proposeIntent({ moveType: 'placeInfluence', payload: { id: 2 } } as any);
        });

        // Should still be the first one
        expect(result.current.proposedIntent?.payload).toEqual({ id: 1 });
    });

    it('editDraftTarget clears draft and returns to selectingParams', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: {}, tiles: {}, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        act(() => {
            result.current.setActionMode('placeInfluence');
            result.current.proposeIntent({ moveType: 'placeInfluence', payload: {} } as any);
        });
        expect(result.current.interactionState).toBe('draftReady');

        act(() => {
            result.current.editDraftTarget();
        });

        expect(result.current.interactionState).toBe('selectingParams');
        expect(result.current.proposedIntent).toBeNull();
        expect(result.current.actionMode).toBe('placeInfluence');
    });

    it('blocks selectTile side effects when draftReady', () => {
        const { result } = renderHook(() => useGameInteractionController({
            G: { zones: {}, grid: { '0,0': 'tile1' }, tiles: { tile1: { id: 'tile1' } }, objects: {} } as any,
            ctx: { currentPlayer: '0' },
            playerID: '0',
            moves: {}
        }));

        act(() => {
            result.current.setActionMode('moveInfluence');
            result.current.proposeIntent({ moveType: 'moveInfluence', payload: {} } as any);
        });
        expect(result.current.interactionState).toBe('draftReady');

        // Try to select tile (which would normally set source if not set)
        act(() => {
            result.current.selectTile('tile1', '0,0');
        });

        expect(result.current.moveInfluenceSourceId).toBeNull();
        expect(result.current.selectedTileId).toBe('tile1'); // Inspect only
    });
});
