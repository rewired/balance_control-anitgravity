import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const GAME_ROOT = path.resolve(__dirname, '../src');

/**
 * Recursively find all .ts files in directory
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

describe('Boundary Hardening: UI Imports', () => {
    it('should not import from expansion UI entrypoints in engine code', () => {
        const files = findTsFiles(GAME_ROOT);
        const violations: string[] = [];

        // Regex to match forbidden imports.
        // Captures:
        // import ... from '...'
        // import '...'
        // import('...')
        // export ... from '...'
        const importCaptureRegex = /(?:import|export)\s+(?:[\w\s{},*]*\s+from\s+)?['"](@balance-control\/[^'"]*)['"]|(?:import|export)\s*\(['"](@balance-control\/[^'"]*)['"]\)|from\s+['"](@balance-control\/[^'"]*)['"]/g;

        for (const filePath of files) {
            const relativePath = path.relative(GAME_ROOT, filePath);
            // Skip the test file itself to avoid self-flagging
            if (relativePath.includes('boundary-hardening-ui.test.ts')) continue;

            const content = fs.readFileSync(filePath, 'utf-8');

            let match;
            while ((match = importCaptureRegex.exec(content)) !== null) {
                const importPath = match[1] || match[2] || match[3];
                if (!importPath) continue;

                // Check if it matches the forbidden pattern: @balance-control/*/ui
                if (/\/ui(\/|$)/.test(importPath)) {
                     const linesBefore = content.substring(0, match.index).split('\n');
                     const lineNum = linesBefore.length;
                     violations.push(`${relativePath}:${lineNum}: ${importPath}`);
                }
            }
        }

        if (violations.length > 0) {
            const sortedViolations = [...violations].sort();
            throw new Error(`Forbidden UI imports found in engine code:\n${sortedViolations.join('\n')}`);
        }
    });
});
