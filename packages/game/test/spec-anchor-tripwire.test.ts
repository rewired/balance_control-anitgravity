import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const RULE_ID_PATTERN = /\b(?:CORE|EXP|VAR|ADD56)-\d{2}(?:-(?:\d{2}[A-Z]?|[A-Z]|T\d{2}))+(?:\.\d+[A-Z]?)*\b/g;
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs', '.json', '.md', '.yml', '.yaml']);
const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.pnpm',
    '.turbo',
    'legacy',
    'node_modules',
    'dist',
    'build',
    'coverage',
]);

type Violation = {
    id: string;
    filePath: string;
    line: number;
    column: number;
};

function getRepoRoot() {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(currentDir, '..', '..', '..');
}

function normalizePath(filePath: string) {
    return filePath.split(path.sep).join('/');
}

function shouldSkipDir(entry: fs.Dirent) {
    return entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name);
}

function walkDir(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        if (shouldSkipDir(entry)) {
            continue;
        }

        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDir(entryPath));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (SCAN_EXTENSIONS.has(ext)) {
                files.push(entryPath);
            }
        }
    }

    return files;
}

function readRegistryAnchors(repoRoot: string) {
    const registryPath = path.join(repoRoot, 'packages', 'rules', 'src', 'spec-anchors.generated.json');
    const raw = fs.readFileSync(registryPath, 'utf8');
    const parsed = JSON.parse(raw) as { anchors?: Array<{ id: string }> };
    const anchors = parsed.anchors ?? [];
    return new Set(anchors.map((anchor) => anchor.id));
}

function collectViolations(filePath: string, knownAnchors: Set<string>): Violation[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const violations: Violation[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const matches = line.matchAll(RULE_ID_PATTERN);
        for (const match of matches) {
            const id = match[0];
            if (!knownAnchors.has(id)) {
                violations.push({
                    id,
                    filePath,
                    line: lineIndex + 1,
                    column: (match.index ?? 0) + 1,
                });
            }
        }
    }

    return violations;
}

function formatViolations(violations: Violation[], repoRoot: string) {
    const lines = ['Unknown rule ID references (missing from registry):'];
    for (const violation of violations) {
        const relativePath = normalizePath(path.relative(repoRoot, violation.filePath));
        lines.push(`- ${relativePath}:${violation.line}:${violation.column} -> ${violation.id}`);
    }
    return lines.join('\n');
}

describe('Tripwire: spec anchor registry', () => {
    it('fails if any referenced rule ID is missing from the registry', () => {
        const repoRoot = getRepoRoot();
        const knownAnchors = readRegistryAnchors(repoRoot);
        const scannedFiles = walkDir(repoRoot).sort((a, b) => a.localeCompare(b));
        const violations: Violation[] = [];

        for (const filePath of scannedFiles) {
            violations.push(...collectViolations(filePath, knownAnchors));
        }

        const sortedViolations = violations.sort((a, b) => {
            const aKey = `${a.filePath}:${a.line}:${a.column}`;
            const bKey = `${b.filePath}:${b.line}:${b.column}`;
            return aKey.localeCompare(bKey);
        });

        if (sortedViolations.length > 0) {
            throw new Error(formatViolations(sortedViolations, repoRoot));
        }

        expect(sortedViolations).toEqual([]);
    });
});
