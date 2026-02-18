import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from '../src/index';
import { SetupGame } from '../src/setup';
import { hashState } from '../src/hash-state';
import { Expansion01 } from '../../expansion-01/src/index';
import { Expansion02 } from '../../expansion-02/src/index';
import { Expansion03 } from '../../expansion-03/src/index';
import { CoreZoneNames, TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

interface GoldenMove {
    move: string;
    args: any[];
}

interface GoldenFixture {
    id: string;
    seed: string | number;
    numPlayers: number;
    config?: unknown;
    registerExpansions?: string[];
    prelude?: PreludeAction[];
    moves: GoldenMove[];
    expectedFinalHash: string;
    expectedPublicSurfaceHash: string;
}

type PreludeAction =
    | {
          action: 'stackDrawPileByType';
          tileType: TileType;
          resort?: string;
          count?: number;
      }
    | {
          action: 'seedResources';
          playerId: string;
          resort: string;
          count?: number;
      }
    | {
          action: 'setMetaMarker';
          playerId: string;
          zoneId: string;
          mode?: string;
      };

function loadGoldenFixtures(): GoldenFixture[] {
    const goldenDir = path.resolve(__dirname, './golden');
    const files = readdirSync(goldenDir)
        .filter((name) => name.endsWith('.json'))
        .sort();

    return files.map((fileName) => {
        const filePath = path.join(goldenDir, fileName);
        return JSON.parse(readFileSync(filePath, 'utf8')) as GoldenFixture;
    });
}

function registerFixtureExpansions(names?: string[]): void {
    const expansions: any[] = [];
    if (names?.includes('ex01')) {
        expansions.push(Expansion01 as any);
    }
    if (names?.includes('ex02')) {
        expansions.push(Expansion02 as any);
    }
    if (names?.includes('ex03')) {
        expansions.push(Expansion03 as any);
    }
    registerTestPacks(expansions);
}

function applyPrelude(G: any, prelude?: PreludeAction[]): void {
    if (!prelude || prelude.length === 0) return;
    for (const step of prelude) {
        if (step.action === 'stackDrawPileByType') {
            const drawPile = G.zones[CoreZoneNames.DrawPile];
            if (!drawPile) continue;
            const count = Math.max(1, step.count ?? 1);
            for (let i = 0; i < count; i++) {
                const idx = drawPile.items.findIndex((tileId: string) => {
                    const tile = G.tiles[tileId];
                    if (!tile) return false;
                    if (step.tileType && tile.type !== step.tileType) return false;
                    if (step.resort && tile.resort !== step.resort) return false;
                    return true;
                });
                if (idx === -1) break;
                const [tileId] = drawPile.items.splice(idx, 1);
                drawPile.items.push(tileId);
            }
            continue;
        }
        if (step.action === 'seedResources') {
            const supplyId = `${CoreZoneNames.PersonalSupply}:${step.playerId}`;
            const supply = G.zones[supplyId];
            if (!supply) continue;
            const count = Math.max(1, step.count ?? 1);
            for (let i = 0; i < count; i++) {
                const id = `pre_res_${step.playerId}_${step.resort}_${i + 1}`;
                if (G.objects[id]) continue;
                G.objects[id] = { id, type: 'Resource', resort: step.resort, owner: step.playerId };
                supply.items.push(id);
            }
            continue;
        }
        if (step.action === 'setMetaMarker') {
            const markerId = `meta_${step.playerId}`;
            const marker = G.objects[markerId];
            if (!marker) continue;
            for (const zone of Object.values(G.zones)) {
                const idx = zone.items.indexOf(markerId);
                if (idx >= 0) {
                    zone.items.splice(idx, 1);
                }
            }
            const targetZone = G.zones[step.zoneId];
            if (!targetZone) continue;
            targetZone.items.push(markerId);
            if (step.mode !== undefined) marker.mode = step.mode;
        }
    }
}

function resolveMoveArgs(G: any, move: string, args: any[]): any[] {
    if (!args || args.length === 0) return args;
    return args.map((arg) => {
        if (!arg || typeof arg !== 'object') return arg;
        if (move === 'moveInfluence') {
            const { sourceCoord, targetCoord, ...rest } = arg;
            const sourceId = sourceCoord ? G.grid[sourceCoord] : rest.sourceId;
            const targetId = targetCoord ? G.grid[targetCoord] : rest.targetId;
            return { ...rest, sourceId, targetId };
        }
        if (move === 'placeInfluence') {
            const { targetCoord, ...rest } = arg;
            const targetTileId = targetCoord ? G.grid[targetCoord] : rest.targetTileId;
            return { ...rest, targetTileId };
        }
        if (move === 'convertResources') {
            const { grassrootsCoord, ...rest } = arg;
            const grassrootsTileId = grassrootsCoord ? G.grid[grassrootsCoord] : rest.grassrootsTileId;
            return { ...rest, grassrootsTileId };
        }
        if (move === 'formalizeInfluence') {
            const { committeeCoord, ...rest } = arg;
            const committeeTileId = committeeCoord ? G.grid[committeeCoord] : rest.committeeTileId;
            return { ...rest, committeeTileId };
        }
        return arg;
    });
}

function buildReplayGame(seed: string | number, numPlayers: number, config?: unknown, prelude?: PreludeAction[]): any {
    const baseGame = createBalanceControlGame();
    return {
        ...baseGame,
        seed,
        playerView: ({ G }: any) => G,
        setup: (ctx: any) => {
            if (!ctx.numPlayers) {
                ctx.numPlayers = numPlayers;
            }
            const G = SetupGame({ ctx, setupData: config });
            applyPrelude(G, prelude);
            return G;
        },
    };
}

describe('Golden replays', () => {
    const fixtures = loadGoldenFixtures();

    for (const fixture of fixtures) {
        it(`should match golden hash for ${fixture.id}`, () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                registerFixtureExpansions(fixture.registerExpansions);

                const game = buildReplayGame(fixture.seed, fixture.numPlayers, fixture.config, fixture.prelude);
                const client = Client({
                    game,
                    numPlayers: fixture.numPlayers,
                });
                client.start();

                for (const step of fixture.moves) {
                    const state = client.getState();
                    const resolvedArgs = resolveMoveArgs(state!.G, step.move, step.args);
                    const moveFn = (client.moves as any)[step.move];
                    expect(typeof moveFn).toBe('function');
                    moveFn(...resolvedArgs);
                }

                const state = client.getState();
                expect(state).toBeTruthy();
                const actualHash = hashState(state!.G as any);
                expect(actualHash).toBe(fixture.expectedFinalHash);
                expect(state!.G.meta?.publicSurfaceHash).toBe(fixture.expectedPublicSurfaceHash);
                expect(warnSpy).not.toHaveBeenCalled();
                expect(errorSpy).not.toHaveBeenCalled();
            } finally {
                warnSpy.mockRestore();
                errorSpy.mockRestore();
            }
        });
    }
});
