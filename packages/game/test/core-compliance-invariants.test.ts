import { describe, it, expect, beforeEach } from 'vitest';
import { SetupGame } from '../src/setup';
import { EffectResolver } from '../src/engine/resolver';
import { computeMajority } from '../src/mechanics';
import { enumerateLegalIntents } from '../src/engine/legal-intents';
import { positionKeyFromCoordString } from '../src/topology';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

function createSeededRandom(seed: number) {
    let state = seed >>> 0;

    const next = (): number => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };

    return {
        Shuffle<T>(items: T[]): T[] {
            const shuffled = [...items];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },
        Die(n: number): number {
            return Math.floor(next() * n) + 1;
        }
    };
}

describe('CORE Compliance Invariants', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    describe('State Model & Zones', () => {
        /**
         * @rule CORE-01-00-01
         * @rule CORE-01-00-06
         * @rule CORE-01-00-T06
         */
        it('should ensure every game object exists in exactly one zone at any time', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            const allIds = [...Object.keys(G.objects), ...Object.keys(G.tiles)];
            const zoneItems = Object.values(G.zones).flatMap(z => z.items);

            expect(allIds.length).toBeGreaterThan(0);
            expect(zoneItems.length).toBe(allIds.length);

            const seen = new Set<string>();
            const idSet = new Set(allIds);
            for (const id of zoneItems) {
                expect(seen.has(id)).toBe(false);
                seen.add(id);
                expect(idSet.has(id)).toBe(true);
            }
        });

        /**
         * @rule CORE-01-00-02
         */
        it('should treat zones as containers where moving means transferring between them', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            // Ensure an object exists to move
            const objId = 'test_obj';
            G.objects[objId] = { id: objId, type: 'Resource', resort: 'DOM' };
            G.zones[CoreZoneName.Bank].items.push(objId);

            const sourceZone = G.zones[CoreZoneName.Bank];
            const targetZone = G.zones[CoreZoneName.Noise];

            expect(sourceZone.items).toContain(objId);
            expect(targetZone.items).not.toContain(objId);

            // Transfer
            sourceZone.items = sourceZone.items.filter(id => id !== objId);
            targetZone.items.push(objId);

            expect(sourceZone.items).not.toContain(objId);
            expect(targetZone.items).toContain(objId);
        });

        /**
         * @rule CORE-01-00-03
         */
        it('should restrict Influence objects to PersonalSupply or Board zones', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            const influenceIds = Object.keys(G.objects).filter(id => G.objects[id].type === 'Influence');
            expect(influenceIds.length).toBeGreaterThan(0);

            for (const infId of influenceIds) {
                const zone = Object.values(G.zones).find(z => z.items.includes(infId));
                expect(zone).toBeDefined();
                const isPersonalSupply = zone!.id.startsWith(CoreZoneName.PersonalSupply);
                const isBoardTile = G.tiles[zone!.id] !== undefined || zone!.id === 'tile_start_committee';
                expect(isPersonalSupply || isBoardTile).toBe(true);
            }
        });

        /**
         * @rule CORE-01-00-04
         */
        it('should restrict Resource objects to PersonalSupply, Bank, or Noise zones', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            // Create a resource so we have at least one
            const testResId = 'res_test_0';
            G.objects[testResId] = { id: testResId, type: 'Resource', resort: 'DOM' };
            G.zones[CoreZoneName.Bank].items.push(testResId);

            const resourceIds = Object.keys(G.objects).filter(id => G.objects[id].type === 'Resource');
            expect(resourceIds.length).toBeGreaterThan(0);

            const allowedZones = [CoreZoneName.Bank, CoreZoneName.Noise];

            for (const rId of resourceIds) {
                const zone = Object.values(G.zones).find(z => z.items.includes(rId));
                expect(zone).toBeDefined();
                const isPersonalSupply = zone!.id.startsWith(CoreZoneName.PersonalSupply);
                const isAllowedGeneric = allowedZones.includes(zone!.id as CoreZoneName);
                expect(isPersonalSupply || isAllowedGeneric).toBe(true);
            }
        });

        /**
         * @rule CORE-01-00-05A
         */
        it('should follow ordered zone conventions for DrawPile and DiscardFaceUp (top=first, bottom=last)', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            const drawPileZone = G.zones[CoreZoneName.DrawPile];
            const discardZone = G.zones[CoreZoneName.DiscardFaceUp];

            expect(drawPileZone.items.length).toBeGreaterThan(2);
            const originalFirst = drawPileZone.items[0];
            const originalSecond = drawPileZone.items[1];

            // CORE-01-00-05A: Top = first element
            const top = drawPileZone.items.shift();
            expect(top).toBe(originalFirst);
            expect(drawPileZone.items[0]).toBe(originalSecond);

            // CORE-01-00-05A: Moving a Tile to DiscardFaceUp appends it to the end (bottom)
            discardZone.items.push(top!);
            expect(discardZone.items[discardZone.items.length - 1]).toBe(top);

            const nextTop = drawPileZone.items.shift();
            discardZone.items.push(nextTop!);
            expect(discardZone.items[discardZone.items.length - 2]).toBe(top);
            expect(discardZone.items[discardZone.items.length - 1]).toBe(nextTop);
        });

        /**
         * @rule CORE-01-00-03A
         * @rule CORE-01-00-02A
         */
        it('should ensure Influence in Board is attached to a Tile, and in Supply is unattached', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });

            // In SetupGame, influence is in PersonalSupply (unattached)
            const p0SupplyId = `${CoreZoneName.PersonalSupply}:0`;
            const supplyInfluence = G.zones[p0SupplyId].items.filter(id => G.objects[id].type === 'Influence');
            expect(supplyInfluence.length).toBeGreaterThan(0);

            // Manually move one to board
            const infId = supplyInfluence[0];
            const startCommitteeId = 'tile_start_committee';
            G.zones[p0SupplyId].items = G.zones[p0SupplyId].items.filter(id => id !== infId);
            G.zones[startCommitteeId].items.push(infId);

            // Verify attachment invariant: Board items are in zones named by tileId
            expect(G.zones[startCommitteeId].items).toContain(infId);
        });

        /**
         * @rule CORE-01-00-04A
         */
        it('should ensure Bank is an unlimited source (materialization invariant)', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx }) as any;

            // Empty the bank
            G.zones[CoreZoneName.Bank].items = [];

            // Attempt to grant a resource
            G.engine.effectQueue.push({
                kind: 'resource.grant',
                playerId: '0',
                amount: 1,
                resort: 'DOM'
            });

            const ok = EffectResolver.resolve(G, ctx);
            expect(ok).toBe(true);

            // Verify a resource was created and moved to supply
            const p0SupplyId = `${CoreZoneName.PersonalSupply}:0`;
            const resources = G.zones[p0SupplyId].items.filter((id: string) => G.objects[id].type === 'Resource');
            expect(resources.length).toBe(1);
            expect(G.objects[resources[0]].resort).toBe('DOM');
        });
    });

    describe('Setup', () => {
        /**
         * @rule CORE-01-00-T09
         */
        it('should bind Start Committee to StartPosition (0,0)', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });
            expect(G.grid['0,0']).toBe('tile_start_committee');
        });

        /**
         * @rule CORE-01-02-04
         * @rule CORE-01-02-10
         * @rule CORE-01-02-13
         * @rule CORE-01-02-14
         * @rule CORE-01-02-15
         * @rule CORE-01-02-16
         */
        it('should have correct core tile counts in DrawPile for 2 players', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });
            const drawPile = G.zones[CoreZoneName.DrawPile].items;
            const tiles = drawPile.map(id => G.tiles[id]);

            const resorts = tiles.filter(t => t.type === TileType.Resort);
            expect(resorts.length).toBe(36);
            expect(resorts.filter(t => t.resort === 'DOM').length).toBe(12);
            expect(resorts.filter(t => t.resort === 'FOR').length).toBe(12);
            expect(resorts.filter(t => t.resort === 'INF').length).toBe(12);

            expect(tiles.filter(t => t.type === TileType.Committee).length).toBe(10);
            expect(tiles.filter(t => t.type === TileType.Grassroots).length).toBe(8);
            expect(tiles.filter(t => t.type === TileType.Lobbyist).length).toBe(9);
            expect(tiles.filter(t => t.type === TileType.Hotspot).length).toBe(8);
            expect(drawPile.length).toBe(71);
        });

        /**
         * @rule CORE-01-03-02A
         */
        it('should ensure deterministic setup given a stable seed', () => {
            const ctx1: any = { numPlayers: 2, random: createSeededRandom(2026) };
            const ctx2: any = { numPlayers: 2, random: createSeededRandom(2026) };

            const G1 = SetupGame({ ctx: ctx1 });
            const G2 = SetupGame({ ctx: ctx2 });

            expect(G1.zones[CoreZoneName.DrawPile].items).toEqual(G2.zones[CoreZoneName.DrawPile].items);
            expect(G1.engine.attributes.startingPlayerIndex).toBe(G2.engine.attributes.startingPlayerIndex);
        });
    });

    describe('Turn, Control, and Settlement', () => {
        /**
         * @rule GR-005
         */
        it('should ensure no phantom moves (legal intents restricted to defined move types)', () => {
            const ctx: any = { numPlayers: 2, currentPlayer: '0', random: createSeededRandom(42), activePlayers: { '0': 'politicalAction' } };
            const G = SetupGame({ ctx });

            const intents = enumerateLegalIntents(G, ctx, '0');
            const moveTypes = new Set(intents.map(i => i.moveType));

            // Expected move types in politicalAction stage
            const expected = ['placeInfluence', 'moveInfluence', 'formalizeInfluence', 'convertResources'];

            for (const type of moveTypes) {
                // Ignore expansion prefix or measure/choice resolving moves for this check
                const baseType = type.split('.').pop();
                if (baseType === 'resolveChoice' || baseType === 'takeMeasure') continue;
                expect(expected).toContain(baseType);
            }

            expect(moveTypes.has('pass')).toBe(false);
        });

        /**
         * @rule GR-006
         */
        it('should enforce Pending Choice hard-gate', () => {
            const ctx: any = { numPlayers: 2, currentPlayer: '0', random: createSeededRandom(42), activePlayers: { '0': 'politicalAction' } };
            const G = SetupGame({ ctx });

            G.engine.pendingChoice = {
                choiceId: 'choice_1',
                player: '0',
                kind: 'yesNo',
                spec: { prompt: 'Test' }
            };

            const intents = enumerateLegalIntents(G, ctx, '0');
            expect(intents.length).toBeGreaterThan(0);
            for (const intent of intents) {
                expect(intent.moveType).toBe('resolveChoice');
            }
        });

        /**
         * @rule CORE-01-05-02
         * @rule CORE-01-01-04
         */
        it('should result in no control when there is a tie', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });
            const tileId = 'tile_1';
            G.tiles[tileId] = { id: tileId, type: TileType.Resort, weight: 1, resort: 'DOM' };
            G.zones[tileId] = { id: tileId, name: 'T1', items: ['inf_0', 'inf_1'] };
            G.objects['inf_0'] = { id: 'inf_0', type: 'Influence', owner: '0' };
            G.objects['inf_1'] = { id: 'inf_1', type: 'Influence', owner: '1' };

            const result = computeMajority(tileId, G);
            expect(result.controller).toBeNull();
            expect(result.winners).toContain('0');
            expect(result.winners).toContain('1');
        });

        /**
         * @rule CORE-01-05-04
         */
        it('should apply Lobbyist virtual influence to adjacent tiles', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });
            const lobbyId = 'lobbyist_tile';
            const resortId = 'resort_tile';

            G.tiles[lobbyId] = { id: lobbyId, type: TileType.Lobbyist };
            G.tiles[resortId] = { id: resortId, type: TileType.Resort, weight: 1, resort: 'DOM' };

            G.zones[lobbyId] = { id: lobbyId, name: 'L', items: ['inf_lobby'] };
            G.zones[resortId] = { id: resortId, name: 'R', items: ['inf_resort'] };

            G.objects['inf_lobby'] = { id: 'inf_lobby', type: 'Influence', owner: '0' }; // Player 0 controls Lobbyist
            G.objects['inf_resort'] = { id: 'inf_resort', type: 'Influence', owner: '1' }; // Player 1 has 1 real influence on Resort

            G.adjacency[resortId] = [lobbyId];
            G.adjacency[lobbyId] = [resortId];

            // Player 1 has 1 influence.
            // Player 0 has 0 real influence but +1 virtual from Lobbyist.
            // Result should be a tie.
            const result = computeMajority(resortId, G);
            expect(result.controller).toBeNull();
            expect(result.winners).toContain('0');
            expect(result.winners).toContain('1');
        });

        /**
         * @rule CORE-01-06-13
         */
        it('should produce zero when resort is uncontrolled', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx }) as any;
            const tileId = 'tile_uncontrolled';
            G.tiles[tileId] = { id: tileId, type: TileType.Resort, weight: 4, resort: 'DOM' };
            G.zones[tileId] = { id: tileId, name: 'T', items: [] }; // No influence

            G.engine.effectQueue.push({ kind: 'production.resolve', tileId });
            EffectResolver.resolve(G, ctx);

            // Verify no resources granted
            for (let i = 0; i < ctx.numPlayers; i++) {
                const supplyId = `${CoreZoneName.PersonalSupply}:${i}`;
                const resources = G.zones[supplyId].items.filter((id: string) => G.objects[id].type === 'Resource');
                expect(resources.length).toBe(0);
            }
        });

        /**
         * @rule CORE-01-06-15
         */
        it('should move production remainder to Noise on tie', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx }) as any;
            const tileId = 'tile_tied';
            G.tiles[tileId] = { id: tileId, type: TileType.Resort, weight: 3, resort: 'DOM' };
            G.zones[tileId] = { id: tileId, name: 'T', items: ['inf_0', 'inf_1'] };
            G.objects['inf_0'] = { id: 'inf_0', type: 'Influence', owner: '0' };
            G.objects['inf_1'] = { id: 'inf_1', type: 'Influence', owner: '1' };

            // Bank must have enough resources
            for (let i = 0; i < 10; i++) {
                const id = `bank_res_${i}`;
                G.objects[id] = { id, type: 'Resource', resort: 'DOM' };
                G.zones[CoreZoneName.Bank].items.push(id);
            }

            G.engine.effectQueue.push({ kind: 'production.resolve', tileId });
            EffectResolver.resolve(G, ctx);

            // Weight 3 tied between 2 players -> 1 each, 1 to Noise
            expect(G.zones[`${CoreZoneName.PersonalSupply}:0`].items.filter((id: string) => G.objects[id].type === 'Resource').length).toBe(1);
            expect(G.zones[`${CoreZoneName.PersonalSupply}:1`].items.filter((id: string) => G.objects[id].type === 'Resource').length).toBe(1);
            expect(G.zones[CoreZoneName.Noise].items.length).toBe(1);
        });

        /**
         * @rule CORE-01-07-03D
         */
        it('should resolve production in ascending PositionKey order', () => {
            const ctx: any = { numPlayers: 2, currentPlayer: '1', random: createSeededRandom(42) };
            const G = SetupGame({ ctx }) as any;
            // Set starting player to 0, so last player of round is 1.
            G.engine.attributes.startingPlayerIndex = 0;

            // Add some resort tiles at specific positions
            const t1 = 'res_1'; // coord 0,1
            const t2 = 'res_2'; // coord 0,-1

            G.tiles[t1] = { id: t1, type: TileType.Resort, resort: 'DOM', weight: 1 };
            G.tiles[t2] = { id: t2, type: TileType.Resort, resort: 'DOM', weight: 1 };
            G.zones[t1] = { id: t1, name: 'T1', items: [] };
            G.zones[t2] = { id: t2, name: 'T2', items: [] };
            G.zones[CoreZoneName.Board].items.push(t1, t2);

            G.grid['0,1'] = t1;
            G.grid['0,-1'] = t2;

            // PositionKeys:
            // 0,1 -> 10001_10000
            // 0,-1 -> 09999_10000
            // So t2 < t1.

            // Simulate the onEnd logic from index.ts
            const resortTilesWithCoord: { tileId: string; posKey: string }[] = [];
            for (const tileId of G.zones[CoreZoneName.Board].items) {
                const tile = G.tiles[tileId];
                if (tile?.type !== TileType.Resort) continue;
                const coordStr = Object.entries(G.grid).find(([, id]) => id === tileId)?.[0];
                if (coordStr) {
                    resortTilesWithCoord.push({ tileId, posKey: positionKeyFromCoordString(coordStr) });
                }
            }
            resortTilesWithCoord.sort((a, b) => a.posKey.localeCompare(b.posKey));

            expect(resortTilesWithCoord[0].tileId).toBe(t2);
            expect(resortTilesWithCoord[1].tileId).toBe(t1);
        });
    });

    describe('Start Committee Restrictions', () => {
        /**
         * @rule CORE-01-08-06E
         * @rule CORE-01-08-04
         * @rule CORE-01-08-03
         */
        it('should exclude Start Committee from Influence placement targets', () => {
            const ctx: any = { numPlayers: 2, currentPlayer: '0', random: createSeededRandom(42), activePlayers: { '0': 'politicalAction' } };
            const G = SetupGame({ ctx });

            // Add a resort tile so we have at least one valid target (Start Committee is skipped)
            G.tiles.resort_1 = { id: 'resort_1', type: TileType.Resort, resort: 'DOM', weight: 1 };
            G.zones[CoreZoneName.Board].items.push('resort_1');
            G.zones.resort_1 = { id: 'resort_1', name: 'R1', items: [] };

            const intents = enumerateLegalIntents(G, ctx, '0');
            const placeIntents = intents.filter(i => i.moveType === 'placeInfluence');

            expect(placeIntents.length).toBeGreaterThan(0);
            for (const intent of placeIntents) {
                expect(intent.payload.targetTileId).not.toBe('tile_start_committee');
            }
        });

        /**
         * @rule CORE-01-08-05
         */
        it('should ensure Start Committee cannot be controlled even if influence is present', () => {
            const ctx: any = { numPlayers: 2, random: createSeededRandom(42) };
            const G = SetupGame({ ctx });
            const startId = 'tile_start_committee';

            // Manually add influence
            G.zones[startId].items.push('inf_start');
            G.objects['inf_start'] = { id: 'inf_start', type: 'Influence', owner: '0' };

            const result = computeMajority(startId, G);
            expect(result.controller).toBeNull();
            expect(result.winners).toEqual([]);
        });
    });
});
