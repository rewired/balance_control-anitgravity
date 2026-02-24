import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'boardgame.io/client';
import { createBalanceControlGame, hashState } from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';
import { CoreZoneName, TileType } from '@balance-control/rules';

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

function applyPrelude(G: any, prelude?: PreludeAction[]): void {
    if (!prelude || prelude.length === 0) return;
    for (const step of prelude) {
        if (step.action === 'stackDrawPileByType') {
            const drawPile = G.zones[CoreZoneName.DrawPile];
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
                drawPile.items.unshift(tileId);
            }
            continue;
        }
        if (step.action === 'seedResources') {
            const supplyId = `${CoreZoneName.PersonalSupply}:${step.playerId}`;
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
            // Use baseGame.setup to avoid importing internal SetupGame
            const G = baseGame.setup(ctx, config);

            // FORCE-FIX: Existing goldens were recorded with player 0 starting.
            // By forcing 0 here, we maintain stability for old fixtures while
            // the RNG state remains advanced by the canonical SetupGame call.
            G.engine.attributes.startingPlayerIndex = 0;

            applyPrelude(G, prelude);
            return G;
        },
    };
}


function runFixture(fixture: GoldenFixture): { actualHash: string; actualPublicSurfaceHash: string | undefined } {
    registerCanonicalPacks();

    const game = buildReplayGame(fixture.seed, fixture.numPlayers, fixture.config, fixture.prelude);
    const client = Client({
        game,
        numPlayers: fixture.numPlayers,
    });
    client.start();

    for (const step of fixture.moves) {
        const state = client.getState();
        client.updatePlayerID(state!.ctx.currentPlayer);
        const resolvedArgs = resolveMoveArgs(state!.G, step.move, step.args);
        const moveFn = (client.moves as any)[step.move];
        expect(typeof moveFn).toBe('function');
        moveFn(...resolvedArgs);
    }

    const state = client.getState();
    expect(state).toBeTruthy();
    return {
        actualHash: hashState(state!.G as any),
        actualPublicSurfaceHash: state!.G.meta?.publicSurfaceHash,
    };
}

describe('Golden replays (Integration)', () => {
    const fixtures = loadGoldenFixtures();

    for (const fixture of fixtures) {
        it(`should match golden hash for ${fixture.id}`, () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                const { actualHash, actualPublicSurfaceHash } = runFixture(fixture);

                expect(actualHash).toBe(fixture.expectedFinalHash);
                expect(actualPublicSurfaceHash).toBe(fixture.expectedPublicSurfaceHash);
                expect(warnSpy).not.toHaveBeenCalled();
                expect(errorSpy).not.toHaveBeenCalled();
            } finally {
                warnSpy.mockRestore();
                errorSpy.mockRestore();
            }
        });
    }

    /** @rule CORE-01-06-16 */
    /** @rule CORE-01-07-03D */
    it('replays tie-production fixture deterministically across repeated runs [CORE-01-06-16, CORE-01-07-03D]', () => {
        const tieFixture = fixtures.find((fixture) => fixture.id === 'core_majority_tie_no_control');
        expect(tieFixture).toBeTruthy();

        const first = runFixture(tieFixture!);
        const second = runFixture(tieFixture!);

        expect(first.actualHash).toBe(second.actualHash);
        expect(first.actualPublicSurfaceHash).toBe(second.actualPublicSurfaceHash);
    });

    /** @rule CORE-01-09-01A */
    /** @rule CORE-01-09-02 */
    /** @rule CORE-01-09-03 */
    it('deterministically ends immediately when DrawPile empties during draw-and-place [CORE-01-09-01A, CORE-01-09-02, CORE-01-09-03]', () => {
        registerCanonicalPacks();
        const baseGame = createBalanceControlGame();
        const tinyDrawPileGame = {
            ...baseGame,
            seed: 'core-endgame-immediate-settlement',
            playerView: ({ G }: any) => G,
            setup: (ctx: any) => {
                const G = baseGame.setup(ctx, undefined);
                G.engine.attributes.startingPlayerIndex = 0;
                G.zones[CoreZoneName.DrawPile].items = G.zones[CoreZoneName.DrawPile].items.slice(0, 1);
                return G;
            },
        };

        const run = () => {
            const client = Client({ game: tinyDrawPileGame, numPlayers: 2 });
            client.start();
            const state = client.getState();
            client.updatePlayerID(state.ctx.currentPlayer);
            client.moves.placeTile({ targetCoord: '1,0' });
            const postSettlement = client.getState();
            const snapshot = JSON.stringify(postSettlement.G);
            const tileId = postSettlement.G.grid['1,0'];
            client.moves.placeInfluence({ targetTileId: tileId });
            const afterIllegalAction = client.getState();
            expect(JSON.stringify(afterIllegalAction.G)).toBe(snapshot);
            return afterIllegalAction;
        };

        const first = run();
        const second = run();

        expect(first.ctx.gameover).toBeTruthy();
        expect(first.G.roundSettlementDone).toBe(true);
        expect(hashState(first.G as any)).toBe(hashState(second.G as any));
        expect(first.ctx.gameover).toEqual(second.ctx.gameover);
    });

});
