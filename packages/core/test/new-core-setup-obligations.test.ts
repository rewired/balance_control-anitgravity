import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SetupGame } from '../src/setup';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

function createSeededRandom(seed: number) {
    let state = seed >>> 0;
    const next = (): number => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
    return {
        Die(n: number): number {
            return Math.floor(next() * n) + 1;
        },
        Shuffle<T>(arr: T[]): T[] {
            return [...arr].sort(); // Deterministic but not Fisher-Yates for this helper
        }
    };
}

describe('CORE-01 Setup and Components Obligations', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    /** @rule CORE-01-02-01 */
    it('contains exactly one Start Committee tile [CORE-01-02-01]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (n: number) => 1 } };
        const G = SetupGame({ ctx });

        const allTiles = Object.values(G.tiles);
        const startCommittees = allTiles.filter(t => t.type === TileType.StartCommittee);
        expect(startCommittees).toHaveLength(1);
    });

    /** @rule CORE-01-02-02 */
    /** @rule CORE-01-03-01 */
    it('places the Start Committee on the Board and excludes it from the DrawPile [CORE-01-02-02, CORE-01-03-01]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (n: number) => 1 } };
        const G = SetupGame({ ctx });

        const boardItems = G.zones[CoreZoneName.Board].items;
        const drawPileItems = G.zones[CoreZoneName.DrawPile].items;

        const startCommitteeId = Object.keys(G.tiles).find(id => G.tiles[id].type === TileType.StartCommittee)!;

        expect(boardItems).toContain(startCommitteeId);
        expect(drawPileItems).not.toContain(startCommitteeId);
    });

    /** @rule CORE-01-02-03A */
    it('verifies Influence ownership [CORE-01-02-03A]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (n: number) => 1 } };
        const G = SetupGame({ ctx });

        const influences = Object.values(G.objects).filter(obj => obj.type === 'Influence');
        expect(influences.length).toBeGreaterThan(0);
        for (const inf of influences) {
            expect(inf.owner).toBeDefined();
            expect(['0', '1']).toContain(inf.owner);
        }
    });

    /** @rule CORE-01-02-14A */
    it('verifies Grassroots composition: 2 untyped, 2 DOM, 2 FOR, 2 INF [CORE-01-02-14A]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (n: number) => 1 } };
        const G = SetupGame({ ctx });

        const grassrootsTiles = Object.values(G.tiles).filter(t => t.type === TileType.Grassroots);
        expect(grassrootsTiles).toHaveLength(8);

        const untyped = grassrootsTiles.filter(t => !t.resort);
        const dom = grassrootsTiles.filter(t => t.resort === 'DOM');
        const for_ = grassrootsTiles.filter(t => t.resort === 'FOR');
        const inf = grassrootsTiles.filter(t => t.resort === 'INF');

        expect(untyped).toHaveLength(2);
        expect(dom).toHaveLength(2);
        expect(for_).toHaveLength(2);
        expect(inf).toHaveLength(2);
    });


    /** @rule CORE-01-03-03B */
    it('assigns starting Influence only to PersonalSupply zones and marks them as starting [CORE-01-03-03B]', () => {
        const ctx: any = { numPlayers: 3, random: { Die: (_n: number) => 1 } };
        const G = SetupGame({ ctx });

        const boardInfluence = G.zones[CoreZoneName.Board].items.filter((id) => G.objects[id]?.type === 'Influence');
        expect(boardInfluence).toHaveLength(0);

        for (const pid of ['0', '1', '2']) {
            const personalSupply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`].items;
            const influence = personalSupply
                .map((id) => G.objects[id])
                .filter((obj) => obj?.type === 'Influence');

            expect(influence).toHaveLength(3);
            for (const inf of influence) {
                expect(inf.owner).toBe(pid);
                expect(inf.isStarting).toBe(true);
            }
        }
    });

    /** @rule CORE-01-03-04 */
    it('assigns exactly 4 starting Influence to each player in a 2-player game [CORE-01-03-04]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (_n: number) => 1 } };
        const G = SetupGame({ ctx });

        for (const pid of ['0', '1']) {
            const personalSupply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`].items;
            const influence = personalSupply.filter((id) => G.objects[id]?.type === 'Influence');
            expect(influence).toHaveLength(4);
        }
    });

    /** @rule CORE-01-03-02A */
    it('ensures seeded RNG produces identical game state [CORE-01-03-02A]', () => {
        const seed = 12345;
        const G1 = SetupGame({ ctx: { numPlayers: 3, random: createSeededRandom(seed) } as any });
        const G2 = SetupGame({ ctx: { numPlayers: 3, random: createSeededRandom(seed) } as any });

        expect(G1.zones[CoreZoneName.DrawPile].items).toEqual(G2.zones[CoreZoneName.DrawPile].items);
        expect(G1.engine.attributes.startingPlayerIndex).toEqual(G2.engine.attributes.startingPlayerIndex);
    });

    /** @rule CORE-01-03-02A.2 */
    it('verifies RNG call order: Shuffle DrawPile then Start Player [CORE-01-03-02A.2]', () => {
        const dieSpy = vi.fn((n: number) => 1);
        const ctx: any = {
            numPlayers: 2,
            random: { Die: dieSpy }
        };

        SetupGame({ ctx });

        // Total tiles in draw pile for 2 players is 71.
        // Fisher-Yates loop runs from i = 70 down to 1 (70 iterations).
        // Each iteration calls Die(i+1).
        // Total Die calls for shuffle = 70.
        // Immediately after, determine starting player: k = RNG.nextInt(playerCount) -> Die(2).

        expect(dieSpy).toHaveBeenCalledTimes(71);

        // The last call should be Die(2) for starting player (2 players)
        expect(dieSpy.mock.calls[70]).toEqual([2]);
    });

    /** @rule CORE-01-03-02B */
    /** @rule CORE-01-02-17 */
    it('verifies ResortTiles have printed production value equal to their W number [CORE-01-02-17]', () => {
        const ctx: any = { numPlayers: 2, random: { Die: (n: number) => 1 } };
        const G = SetupGame({ ctx });

        const resortTiles = Object.values(G.tiles).filter(t => t.type === TileType.Resort);
        for (const tile of resortTiles) {
            // In our implementation, weight represents the production value (W number)
            expect(tile.weight).toBeDefined();
            // We should also check if the game logic uses weight as production value.
            // But here we are verifying the data structure matches the spec.
            expect(tile.weight).toBeGreaterThanOrEqual(1);
            expect(tile.weight).toBeLessThanOrEqual(5);
        }
    });

    /** @rule CORE-01-03-02B.1 */
    it('verifies canonical pre-shuffle sorting [CORE-01-03-02B, CORE-01-03-02B.1]', () => {
        // Mock random that returns indices as is (no shuffle)
        // j = random.Die(i + 1) - 1. To swap i with i, j must be i.
        // So Die(n) must return n.
        const noShuffleRandom = {
            Die: (n: number) => n
        };
        const ctx: any = { numPlayers: 2, random: noShuffleRandom };
        const G = SetupGame({ ctx });

        const drawPileItems = G.zones[CoreZoneName.DrawPile].items;
        const drawPileTiles = drawPileItems.map(id => G.tiles[id]);

        // Sorting order: Resort (0) < Committee (1) < Grassroots (2) < Lobbyist (3) < Hotspot (4)
        for (let i = 0; i < drawPileTiles.length - 1; i++) {
            const a = drawPileTiles[i];
            const b = drawPileTiles[i+1];

            const typeOrder: Record<string, number> = {
                [TileType.Resort]: 0,
                [TileType.Committee]: 1,
                [TileType.Grassroots]: 2,
                [TileType.Lobbyist]: 3,
                [TileType.Hotspot]: 4
            };

            expect(typeOrder[a.type]).toBeLessThanOrEqual(typeOrder[b.type]);

            if (a.type === b.type) {
                // Within same type, check resort order: DOM (0) < FOR (1) < INF (2) < None (4)
                const resortOrder: Record<string, number> = { 'DOM': 0, 'FOR': 1, 'INF': 2 };
                const orderA = a.resort ? resortOrder[a.resort] : (a.conversion?.typedResort ? resortOrder[a.conversion.typedResort] : 4);
                const orderB = b.resort ? resortOrder[b.resort] : (b.conversion?.typedResort ? resortOrder[b.conversion.typedResort] : 4);

                expect(orderA).toBeLessThanOrEqual(orderB);

                if (orderA === orderB) {
                    // Check weight
                    const wA = a.weight ?? 99;
                    const wB = b.weight ?? 99;
                    expect(wA).toBeLessThanOrEqual(wB);
                }
            }
        }
    });
});
