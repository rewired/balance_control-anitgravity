import { describe, it, expect, beforeEach } from 'vitest';
import { SetupGame } from '../src/setup';
import { ExpansionRegistry } from '../src/expansion-registry';
import { CoreZoneNames, ExpansionDefinition, TileType } from '@balance-control/rules';

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
        }
    };
}

describe('SetupGame', () => {
    beforeEach(() => {
        ExpansionRegistry.clear();
    });

    it('should generate correct number of core tiles', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneNames.DrawPile].items;

        // Resorts: 3 types * 12 = 36
        // Committees: 10
        // Grassroots: 8
        // Lobbyists: 9
        // Hotspots: 8
        // Total = 71
        expect(drawPile.length).toBe(71);

        const tiles = drawPile.map(id => G.tiles[id]);

        const resorts = tiles.filter(t => t.type === TileType.Resort);
        expect(resorts.length).toBe(36);

        const committees = tiles.filter(t => t.type === TileType.Committee);
        expect(committees.length).toBe(10);

        const hotspots = tiles.filter(t => t.type === TileType.Hotspot);
        expect(hotspots.length).toBe(8);
    });

    it('should place Start Committee on Board', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const board = G.zones[CoreZoneNames.Board].items;
        expect(board.length).toBe(1);
        expect(G.tiles[board[0]].type).toBe(TileType.StartCommittee);
    });

    it('should create one meta-marker per player in personal supply', () => {
        const ctx: any = { numPlayers: 3, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const markers = Object.values(G.objects).filter(obj => obj.type === 'MetaMarker');
        expect(markers.length).toBe(3);

        for (const marker of markers) {
            const supplyId = `${CoreZoneNames.PersonalSupply}:${marker.owner}`;
            expect(G.zones[supplyId].items).toContain(marker.id);
        }
    });

    it('should not apply ex01 setup when ex01 flag is disabled', () => {
        const mockEx01: ExpansionDefinition = {
            name: 'EXP-01 Economy & Labor',
            onSetup: (G) => {
                G.tiles.tile_ex01_mock = { id: 'tile_ex01_mock', type: TileType.Resort, resort: 'ECO', weight: 1 };
                G.zones[CoreZoneNames.DrawPile].items.push('tile_ex01_mock');
                G.zones.tile_ex01_mock = { id: 'tile_ex01_mock', name: 'EX01 Mock', items: [] };
            }
        };
        ExpansionRegistry.register(mockEx01);

        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx, setupData: { expansions: { ex01: false } } });

        expect(G.zones[CoreZoneNames.DrawPile].items.includes('tile_ex01_mock')).toBe(false);
        expect(G.tiles.tile_ex01_mock).toBeUndefined();
    });

    it('should apply ex01 setup when enabled and keep deterministic deck composition', () => {
        const mockEx01: ExpansionDefinition = {
            name: 'EXP-01 Economy & Labor',
            onSetup: (G) => {
                G.tiles.tile_ex01_mock = { id: 'tile_ex01_mock', type: TileType.Resort, resort: 'ECO', weight: 1 };
                G.zones[CoreZoneNames.DrawPile].items.push('tile_ex01_mock');
                G.zones.tile_ex01_mock = { id: 'tile_ex01_mock', name: 'EX01 Mock', items: [] };
            }
        };
        ExpansionRegistry.register(mockEx01);

        const enabledA = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: true } }
        });
        const enabledB = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: true } }
        });
        const disabled = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: false } }
        });

        expect(enabledA.zones[CoreZoneNames.DrawPile].items.includes('tile_ex01_mock')).toBe(true);
        expect(enabledB.zones[CoreZoneNames.DrawPile].items.includes('tile_ex01_mock')).toBe(true);
        expect(disabled.zones[CoreZoneNames.DrawPile].items.includes('tile_ex01_mock')).toBe(false);
        expect(enabledA.zones[CoreZoneNames.DrawPile].items).toEqual(enabledB.zones[CoreZoneNames.DrawPile].items);
        expect(enabledA.zones[CoreZoneNames.DrawPile].items).not.toEqual(disabled.zones[CoreZoneNames.DrawPile].items);
    });
});
