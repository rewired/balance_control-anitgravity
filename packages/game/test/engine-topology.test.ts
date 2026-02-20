import { describe, it, expect } from 'vitest';
import { isMoveAdjacent } from '../src/engine/topology';
import { GameState, TileType } from '@balance-control/rules';

describe('isMoveAdjacent', () => {
    const G: GameState = {
        tiles: {
            'A': { id: 'A', type: TileType.Resort },
            'B': { id: 'B', type: TileType.Resort },
            'C': { id: 'C', type: TileType.Resort },
            'Start': { id: 'Start', type: TileType.StartCommittee }
        },
        adjacency: {
            'A': ['Start', 'C'],
            'B': ['Start'],
            'C': ['A'],
            'Start': ['A', 'B']
        },
        zones: {},
        objects: {},
        grid: {},
        engine: {
            idSeq: 0,
            effectQueue: [],
            activeModifiers: [],
            history: [],
            attributes: {}
        }
    } as any;

    it('should allow direct adjacency move', () => {
        expect(isMoveAdjacent(G, 'A', 'C')).toBe(true);
        expect(isMoveAdjacent(G, 'C', 'A')).toBe(true);
    });

    it('should allow Start-Bridge move (A -> Start -> B)', () => {
        expect(isMoveAdjacent(G, 'A', 'B')).toBe(true);
        expect(isMoveAdjacent(G, 'B', 'A')).toBe(true);
    });

    it('should reject non-adjacent, non-bridge move', () => {
        // C is adjacent to A, but A is the only bridge to Start.
        // So C -> A -> Start -> B is NOT allowed (it's 3 steps).
        // Only A -> Start -> B is allowed.
        expect(isMoveAdjacent(G, 'C', 'B')).toBe(false);
    });

    it('should reject Start Committee as source', () => {
        expect(isMoveAdjacent(G, 'Start', 'A')).toBe(false);
    });

    it('should reject Start Committee as destination', () => {
        expect(isMoveAdjacent(G, 'A', 'Start')).toBe(false);
    });

    it('should reject moving to the same tile', () => {
        expect(isMoveAdjacent(G, 'A', 'A')).toBe(false);
    });

    it('should handle missing adjacency entries', () => {
        const G2 = { ...G, adjacency: {} } as any;
        expect(isMoveAdjacent(G2, 'A', 'B')).toBe(false);
    });
});
