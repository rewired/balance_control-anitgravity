import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../src');

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

describe('Boundary Check: No Direct Commit Shortcuts', () => {
    const allFiles = getAllFiles(SRC_ROOT);

    it('should not import dispatchIntent outside allowed files', () => {
        const violations: string[] = [];
        const allowedFiles = [
            'ui/interaction/useGameInteractionController.ts',
            'ui/interaction/dispatchIntent.ts' // It defines it
        ];

        allFiles.forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Check for import of dispatchIntent
            // Matches: import ... from './dispatchIntent' or from '../ui/interaction/dispatchIntent'
            if (content.match(/from\s+['"]\S*dispatchIntent['"]/)) {
                const relativePath = path.relative(SRC_ROOT, filePath).replace(/\\/g, '/');
                if (!allowedFiles.includes(relativePath)) {
                    violations.push(relativePath);
                }
            }
        });

        expect(violations.sort()).toEqual([]);
    });

    it('should not use moves. outside allowed files', () => {
        const violations: string[] = [];
        const allowedFiles = [
            'ui/interaction/dispatchIntent.ts', // The actual dispatcher (matches in comment)
        ];

        allFiles.forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Check for moves.something
            // Regex: \bmoves\.
            if (content.match(/\bmoves\./)) {
                const relativePath = path.relative(SRC_ROOT, filePath).replace(/\\/g, '/');
                if (!allowedFiles.includes(relativePath)) {
                    violations.push(relativePath);
                }
            }
        });

        expect(violations.sort()).toEqual([]);
    });
});
