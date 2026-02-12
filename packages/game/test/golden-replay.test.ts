import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'boardgame.io/client';
import { BalanceControl } from '../src/index';
import { SetupGame } from '../src/setup';
import { hashState } from '../src/hash-state';
import { ExpansionRegistry } from '../src/expansion-registry';
import { Expansion01 } from '../../expansion-01/src/index';

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
    moves: GoldenMove[];
    expectedFinalHash: string;
}

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
    ExpansionRegistry.clear();
    if (!names) return;

    for (const name of names) {
        if (name === 'ex01') {
            ExpansionRegistry.register(Expansion01 as any);
        }
    }
}

function buildReplayGame(seed: string | number, config?: unknown): any {
    return {
        ...BalanceControl,
        seed,
        setup: (ctx: any) => SetupGame({ ctx, setupData: config }),
    };
}

describe('Golden replays', () => {
    const fixtures = loadGoldenFixtures();

    for (const fixture of fixtures) {
        it(`should match golden hash for ${fixture.id}`, () => {
            registerFixtureExpansions(fixture.registerExpansions);

            const game = buildReplayGame(fixture.seed, fixture.config);
            const client = Client({
                game,
                numPlayers: fixture.numPlayers,
            });
            client.start();

            for (const step of fixture.moves) {
                const moveFn = (client.moves as any)[step.move];
                expect(typeof moveFn).toBe('function');
                moveFn(...step.args);
            }

            const state = client.getState();
            expect(state).toBeTruthy();
            const actualHash = hashState(state!.G as any);
            expect(actualHash).toBe(fixture.expectedFinalHash);
        });
    }
});
