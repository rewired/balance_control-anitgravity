import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');

function assertBootWiring(filePath: string) {
    const content = readFileSync(filePath, 'utf8');
    // Ensure we are using the canonical pack registration helper
    // which guarantees correct load order (GR-003)
    const packsIndex = content.indexOf('registerCanonicalPacks');
    expect(packsIndex).toBeGreaterThan(-1);
}

describe('Entrypoint pack wiring', () => {
    it('uses registerCanonicalPacks in server boot', () => {
        assertBootWiring(path.join(rootDir, 'packages', 'server', 'src', 'boot.ts'));
    });

    it('uses registerCanonicalPacks in bot boot', () => {
        assertBootWiring(path.join(rootDir, 'packages', 'bot-llm', 'src', 'boot.ts'));
    });
});
