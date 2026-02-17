import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { SetupGame } from '../src/setup';
import { EffectResolver } from '../src/engine/resolver';
import { CoreZoneNames } from '@balance-control/rules';
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
        }
    };
}

function collectTsFiles(dirPath: string): string[] {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectTsFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

function runDeterministicScenario(seed: number): { snapshot: string; pendingChoiceId?: string } {
    registerTestPacks();
    const ctx: any = {
        numPlayers: 2,
        currentPlayer: '0',
        random: createSeededRandom(seed)
    };
    const G = SetupGame({ ctx });

    // Force deterministic ID creation path in resolver (bank miss -> synthetic resource IDs).
    G.zones[CoreZoneNames.Bank].items = [];

    G.engine.effectQueue.push(
        { kind: 'resource.grant', playerId: '0', amount: 2, resort: 'DOM' },
        { kind: 'influence.formalize', playerId: '0', resourceIds: [] },
        {
            kind: 'choice.request',
            choice: {
                sourceId: 'test',
                player: '0',
                kind: 'yesNo',
                spec: { prompt: 'continue?' }
            }
        }
    );

    EffectResolver.resolve(G as any, ctx);
    return {
        snapshot: JSON.stringify(G),
        pendingChoiceId: G.engine.pendingChoice?.choiceId
    };
}

describe('Determinism policy', () => {
    it('forbids Date.now and Math.random in gameplay source packages', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const sourceDirs = [
            path.join(rootDir, 'packages', 'game', 'src'),
            path.join(rootDir, 'packages', 'expansion-01', 'src'),
            path.join(rootDir, 'packages', 'expansion-02', 'src'),
            path.join(rootDir, 'packages', 'expansion-03', 'src'),
            path.join(rootDir, 'packages', 'rules', 'src')
        ];

        const forbidden = [
            { label: 'Date.now', needle: `Date${'.now('}` },
            { label: 'Math.random', needle: `Math${'.random('}` }
        ];

        const violations: string[] = [];
        for (const dirPath of sourceDirs) {
            for (const filePath of collectTsFiles(dirPath)) {
                const fileContent = readFileSync(filePath, 'utf8');
                const lines = fileContent.split(/\r?\n/);

                lines.forEach((line, index) => {
                    for (const rule of forbidden) {
                        if (line.includes(rule.needle)) {
                            violations.push(`${path.relative(rootDir, filePath)}:${index + 1} uses ${rule.label}`);
                        }
                    }
                });
            }
        }

        expect(violations).toEqual([]);
    });

    it('produces identical snapshots for identical seeded replay input', () => {
        const first = runDeterministicScenario(2026);
        const second = runDeterministicScenario(2026);

        expect(first.snapshot).toBe(second.snapshot);
        expect(first.pendingChoiceId).toBe(second.pendingChoiceId);
        expect(first.pendingChoiceId).toMatch(/^choice_\d+$/);
    });
});
