import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');

function assertBootWiring(filePath: string) {
    const content = readFileSync(filePath, 'utf8');
    const coreIndex = content.indexOf('registerPack(CorePack)');
    const exp01Index = content.indexOf('register(Expansion01)');
    const exp02Index = content.indexOf('register(Expansion02)');
    const exp03Index = content.indexOf('register(Expansion03)');

    expect(coreIndex).toBeGreaterThan(-1);
    expect(exp01Index).toBeGreaterThan(-1);
    expect(exp02Index).toBeGreaterThan(-1);
    expect(exp03Index).toBeGreaterThan(-1);
    expect(coreIndex).toBeLessThan(exp01Index);
    expect(coreIndex).toBeLessThan(exp02Index);
    expect(coreIndex).toBeLessThan(exp03Index);
}

describe('Entrypoint pack wiring', () => {
    it('registers CorePack before registering expansions in the server boot', () => {
        assertBootWiring(path.join(rootDir, 'packages', 'server', 'src', 'boot.ts'));
    });

    it('registers CorePack before registering expansions in the bot boot', () => {
        assertBootWiring(path.join(rootDir, 'packages', 'bot-llm', 'src', 'boot.ts'));
    });
});
