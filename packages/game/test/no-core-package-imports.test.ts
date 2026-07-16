import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_ROOT = path.resolve(__dirname);

/**
 * Kernel-test decontamination guardrail (DD-0366 Decision 5): packages/game/test
 * must never depend on a concrete ruleset package. Tests needing real CORE
 * behavior belong in packages/core/test; tests needing "a" pack use
 * makeTestPack/dummyPacks.ts synthetic fixtures.
 */
function findTsFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findTsFiles(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            return [fullPath];
        }
        return [];
    });
}

const SELF_PATH = path.resolve(__filename);
const IMPORT_CORE_PATTERN = /from\s+['"]@balance-control\/core['"]/;

describe('Kernel test decontamination', () => {
    it('packages/game/test never imports @balance-control/core', () => {
        const files = findTsFiles(TEST_ROOT).filter((filePath) => filePath !== SELF_PATH);
        const violations: string[] = [];

        for (const filePath of files) {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (IMPORT_CORE_PATTERN.test(content)) {
                violations.push(path.relative(TEST_ROOT, filePath));
            }
        }

        if (violations.length > 0) {
            throw new Error(`Kernel tests must not import @balance-control/core:\n${violations.sort().join('\n')}`);
        }
    });
});
