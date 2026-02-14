import { Client } from 'boardgame.io/client';
import { BalanceControl } from './index';
import { SetupGame } from './setup';
import { hashState } from './hash-state';
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
    moves: ReplayMove[];
};

export function runReplay(replay: ReplaySpec): { hash: string; state: any } {
    const game = {
        ...BalanceControl,
        seed: replay.seed ?? undefined,
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
        moveFn(...args);
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
