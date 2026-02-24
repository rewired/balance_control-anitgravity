import { describe, it, expect } from 'vitest';
import { isMoveAdjacent } from '../src/engine/topology';
import { GameState, TileType, CoreZoneName } from '@balance-control/rules';
import { getNeighbors, positionKey, coordToString, stringToCoord } from '../src/topology';
import { SetupGame } from '../src/setup';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { DrawAndPlaceMoves } from '../src/moves/stages/drawAndPlace';
import { registerTestPacks } from './_helpers/registerPacks';
import { beforeEach } from 'vitest';

describe('Topology Invariants', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    /**
     * @rule CORE-01-00-T07
     * @rule CORE-01-00-T02
     */
    it('should define deterministic NeighborPositions', () => {
        const pos = { q: 0, r: 0 };
        const neighbors1 = getNeighbors(pos);
        const neighbors2 = getNeighbors(pos);

        expect(neighbors1).toEqual(neighbors2);
        expect(neighbors1.length).toBe(6);
        // Hexagonal neighbors
        const coords = neighbors1.map(n => coordToString(n));
        expect(coords).toContain('1,0');
        expect(coords).toContain('1,-1');
        expect(coords).toContain('0,-1');
        expect(coords).toContain('-1,0');
        expect(coords).toContain('-1,1');
        expect(coords).toContain('0,1');
    });

    /**
     * @rule CORE-01-00-T08
     * @rule CORE-01-00-T02
     */
    it('should define deterministic total-order PositionKey', () => {
        const p1 = { q: 0, r: 0 };
        const p2 = { q: 1, r: -1 };
        const p3 = { q: 0, r: 1 };

        const k1 = positionKey(p1);
        const k2 = positionKey(p1);
        expect(k1).toBe(k2);

        const keys = [p1, p2, p3].map(positionKey).sort();
        // r= -1 comes first, then r=0, then r=1
        expect(keys[0]).toBe(positionKey(p2)); // r=-1
        expect(keys[1]).toBe(positionKey(p1)); // r=0
        expect(keys[2]).toBe(positionKey(p3)); // r=1
    });

    /**
     * @rule CORE-01-00-09
     * @rule CORE-01-00-10
     * @rule CORE-01-00-T07A
     */
    it('should have consistent adjacency updated after placing a tile via moves', () => {
        const ctx: any = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'drawAndPlace' },
            random: { Die: () => 1 }
        };
        const G = SetupGame({ ctx });

        // Mock a drawn tile in staging
        const tileId = G.zones[CoreZoneName.DrawPile].items[0];
        G.zones[`staging_0`] = { id: 'staging_0', items: [tileId] };

        DrawAndPlaceMoves.placeTile({ G, ctx }, { targetCoord: '1,0' });

        const startId = 'tile_start_committee';
        expect(G.adjacency[startId]).toContain(tileId);
        expect(G.adjacency[tileId]).toContain(startId);

        // Verify adjacency consistency with topology
        const tilePos = stringToCoord('1,0');
        const expectedNeighborCoords = getNeighbors(tilePos).map(coordToString);

        for (const neighborId of G.adjacency[tileId]) {
            const neighborCoord = Object.entries(G.grid).find(([, id]) => id === neighborId)?.[0];
            expect(expectedNeighborCoords).toContain(neighborCoord);
        }
    });

    /**
     * @rule CORE-01-00-08
     * @rule CORE-01-00-T01
     */
    it('should use current topology’s adjacency definition in isMoveAdjacent', () => {
        const G: GameState = {
            tiles: { 'A': { id: 'A' }, 'B': { id: 'B' } },
            adjacency: { 'A': ['B'], 'B': ['A'] },
            grid: {},
            zones: {},
            objects: {},
            engine: { attributes: {} }
        } as any;

        // B is adjacent to A in G.adjacency
        expect(isMoveAdjacent(G, 'A', 'B')).toBe(true);

        // Change adjacency manually
        G.adjacency['A'] = [];
        G.adjacency['B'] = [];
        expect(isMoveAdjacent(G, 'A', 'B')).toBe(false);
    });

    /**
     * @rule CORE-01-00-11
     * @rule CORE-01-00-T03
     */
    it('should only change adjacency-dependent legal intents when topology adjacency changes', () => {
        const ctx: any = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'politicalAction' },
            random: { Die: () => 1 }
        };
        const G = SetupGame({ ctx });

        const normalize = (value: unknown) => JSON.stringify(value);
        const nonMoveIntentSignatures = () =>
            enumerateLegalIntents(G, ctx, '0')
                .filter(intent => intent.moveType !== 'moveInfluence')
                .map(intent => normalize({ moveType: intent.moveType, payload: intent.payload }))
                .sort();

        const baseline = nonMoveIntentSignatures();

        G.adjacency = {
            tile_start_committee: [],
        };

        expect(nonMoveIntentSignatures()).toEqual(baseline);
    });

    /**
     * @rule CORE-01-00-T03
     */
    it('should ensure moveInfluence intents respect topology', () => {
        const ctx: any = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'drawAndPlace' },
            random: { Die: () => 1 }
        };
        const G = SetupGame({ ctx });

        // Place a tile next to Start Committee
        const tileId = G.zones[CoreZoneName.DrawPile].items[0];
        G.zones[`staging_0`] = { id: 'staging_0', items: [tileId] };
        DrawAndPlaceMoves.placeTile({ G, ctx }, { targetCoord: '1,0' });

        // Move to politicalAction stage
        ctx.activePlayers = { '0': 'politicalAction' };

        // Place one influence on the new tile
        const sourceTileId = tileId;
        const infId = 'inf_0_0';
        G.objects[infId] = { id: infId, type: 'Influence', owner: '0' };
        G.zones[sourceTileId].items.push(infId);

        const intents = enumerateLegalIntents(G, ctx, '0');
        const moveIntents = intents.filter(i => i.moveType === 'moveInfluence');

        for (const intent of moveIntents) {
            const { targetTileId } = intent.payload;
            // Every move target must be move-adjacent
            expect(isMoveAdjacent(G, sourceTileId, targetTileId)).toBe(true);
        }
    });
});

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

    /**
     * @rule CORE-01-00-T02
     */
    it('should be deterministic', () => {
        expect(isMoveAdjacent(G, 'A', 'C')).toBe(isMoveAdjacent(G, 'A', 'C'));
        expect(isMoveAdjacent(G, 'A', 'B')).toBe(isMoveAdjacent(G, 'A', 'B'));
    });

    it('should reject moving to the same tile', () => {
        expect(isMoveAdjacent(G, 'A', 'A')).toBe(false);
    });

    it('should handle missing adjacency entries', () => {
        const G2 = { ...G, adjacency: {} } as any;
        expect(isMoveAdjacent(G2, 'A', 'B')).toBe(false);
    });
});
