import { Client } from 'boardgame.io/client';
import { createBalanceControlGame, normalizeGameConfig, hashState, getPublicSurfaceHash } from '@balance-control/game';
import { SetupGame } from './setup';
import type { RulesetManifest } from '@balance-control/rules';

export type ReplayMove = {
    move: string;
    payload?: any;
    args?: any[];
    playerID?: string;
};

export type ReplaySpec = {
    gameName: string;
    gameVersion: string;
    seed?: string | number | null;
    numPlayers: number;
    config?: unknown;
    rulesetManifest?: RulesetManifest;
    publicSurfaceHash?: string;
    moves: ReplayMove[];
};

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

/**
 * Runs a replay and returns the final hash and state.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function runReplay(replay: ReplaySpec): { hash: string; state: any } {
    if (replay.publicSurfaceHash) {
        const config = normalizeGameConfig(replay.config);
        const currentHash = getPublicSurfaceHash(config);
        if (currentHash !== replay.publicSurfaceHash) {
            throw new Error(
                `Replay surface hash mismatch. The replay was created with '${replay.publicSurfaceHash}', but the current engine surface hash is '${currentHash}'.`
            );
        }
    }
    const baseGame = createBalanceControlGame();
    const game = {
        ...baseGame,
        seed: replay.seed ?? undefined,
        playerView: ({ G }: any) => G,
        setup: (ctx: any) => SetupGame({ ctx, setupData: replay.config })
    };

    const client = Client({
        game,
        numPlayers: replay.numPlayers
    });

    client.start();

    for (const step of replay.moves) {
        if (step.playerID !== undefined) {
            (client as any).updatePlayerID(step.playerID);
        }
        const moveFn = (client.moves as any)[step.move];
        if (typeof moveFn !== 'function') {
            throw new Error(`Unknown move: ${step.move}`);
        }
        const args = step.args ?? (step.payload !== undefined ? [step.payload] : []);
        const state = client.getState();
        const resolvedArgs = resolveMoveArgs(state?.G, step.move, args);
        moveFn(...resolvedArgs);
    }

    const state = client.getState();
    if (!state) {
        throw new Error('Replay produced no state');
    }

    return {
        hash: hashState(state.G as any),
        state
    };
}
