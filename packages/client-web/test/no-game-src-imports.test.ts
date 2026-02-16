// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function collectFiles(rootDir: string, exts: Set<string>): string[] {
    const out: string[] = [];
    const stack: string[] = [rootDir];
    while (stack.length) {
        const dir = stack.pop()!;
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                stack.push(p);
                continue;
            }
            const ext = path.extname(ent.name).toLowerCase();
            if (exts.has(ext)) out.push(p);
        }
    }
    return out;
}

describe('boundary: client-web must not import engine source files', () => {
    it('has no /game/src/ imports in packages/client-web/src', () => {
        const srcRoot = path.resolve(__dirname, '..', 'src');
        const files = collectFiles(srcRoot, new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs']));

        const offenders: Array<{ file: string; needle: string }> = [];
        for (const file of files) {
            const text = fs.readFileSync(file, 'utf8');
            for (const needle of ['game/src/', 'game\\src\\']) {
                if (text.includes(needle)) offenders.push({ file, needle });
            }
        }

        expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
    });
});

