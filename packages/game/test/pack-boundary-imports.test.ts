import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const PACKS_ROOT = path.resolve(__dirname, '../src/packs');

/**
 * Recursively find all .ts files in packs root
 */
function findTsFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findTsFiles(fullPath);
        } else if (entry.name.endsWith('.ts')) {
            return [fullPath];
        }
        return [];
    });
}

const EXCLUDED_ROOT_FILES = ['types.ts'];

describe('Pack Boundary Imports', () => {
    it('should only use allowed imports in pack files', () => {
        const files = findTsFiles(PACKS_ROOT);
        const violations: string[] = [];

        for (const filePath of files) {
            const relativePathFromPacks = path.relative(PACKS_ROOT, filePath);

            // Skip infrastructure files in the root of packs/
            if (EXCLUDED_ROOT_FILES.includes(relativePathFromPacks)) {
                continue;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            // Basic regex to find imports (handles both named and side-effect imports)
            const importRegex = /import\s+(?:[\w\s{},*]*\s+from\s+)?['"](.*?)['"]/g;
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];

                // Bare imports (node_modules or workspace packages like @balance-control/rules) are allowed
                if (!importPath.startsWith('.')) {
                    continue;
                }

                // Rule enforcement
                const isAllowed = checkImportPath(relativePathFromPacks, importPath);
                if (!isAllowed) {
                    const linesBefore = content.substring(0, match.index).split('\n');
                    const lineNum = linesBefore.length;
                    violations.push(`${relativePathFromPacks}:${lineNum}: ${importPath}`);
                }
            }
        }

        if (violations.length > 0) {
            const sortedViolations = [...violations].sort((a, b) => a.localeCompare(b));
            throw new Error(`Pack Boundary Violations found:\n${sortedViolations.join('\n')}`);
        }
    });
});

/**
 * Enforces allowed relative import patterns.
 *
 * Rules from Task 0105:
 * - Allowed: pack-local (anything within the same pack directory)
 * - Allowed from packs: ../pack-api, ../types, ../_shared/*
 * - Forbidden: escaping packs root (../../ and beyond)
 * - Forbidden: cross-pack imports (e.g. from exp01 to exp02) except via _shared or pack-api
 */
function checkImportPath(filePathFromPacks: string, importPath: string): boolean {
    // 1. Pack-local (same directory) is always allowed
    if (importPath.startsWith('./')) {
        return true;
    }

    const parts = filePathFromPacks.split(path.sep);
    const depth = parts.length - 1;

    // Root level files in packs/ (depth 0) that were not excluded
    // They can only import ./ (already covered)
    if (depth === 0) return false;

    // Determine the pack directory name (e.g. 'exp01' or '_shared')
    const packDir = parts[0];

    // Resolve the import path relative to the packs root
    const fileDir = path.dirname(filePathFromPacks);
    const resolvedRelativeImport = path.normalize(path.join(fileDir, importPath));

    // Check if it escapes packs root
    if (resolvedRelativeImport.startsWith('..')) {
        return false;
    }

    // Now check if it stays within the same pack OR is one of the allowed common files
    const resolvedParts = resolvedRelativeImport.split(path.sep);
    const resolvedPackDir = resolvedParts[0];

    // Allowed if it stays in the same pack
    if (resolvedPackDir === packDir) {
        return true;
    }

    // Allowed if it's a common infrastructure file in packs root
    if (resolvedRelativeImport === 'pack-api' || resolvedRelativeImport === 'types') {
        return true;
    }

    // Allowed if it's in _shared
    if (resolvedPackDir === '_shared') {
        return true;
    }

    return false;
}
