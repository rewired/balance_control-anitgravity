import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { verifyReplayRecords, type ReplayNdjsonRecord } from '../src/replay-verify';
import { registerTestPacks } from './_helpers/registerPacks';

function loadCanonicalReplayFixtures(): Array<{ fileName: string; records: ReplayNdjsonRecord[] }> {
    const fixtureDir = path.resolve(__dirname, './fixtures/replay');
    return readdirSync(fixtureDir)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b))
        .map((fileName) => ({
            fileName,
            records: JSON.parse(readFileSync(path.join(fixtureDir, fileName), 'utf8')) as ReplayNdjsonRecord[],
        }));
}

describe('Replay verifier canonical fixtures', () => {
    const fixtures = loadCanonicalReplayFixtures();

    it('loads at least one canonical replay fixture', () => {
        expect(fixtures.length).toBeGreaterThan(0);
    });

    for (const fixture of fixtures) {
        it(`validates ${fixture.fileName}`, () => {
            registerTestPacks();
            const result = verifyReplayRecords(fixture.records, { verifyCheckpoints: true });
            expect(result.totalActions).toBeGreaterThanOrEqual(0);
            expect(result.finalStateHash.length).toBeGreaterThan(0);
        });
    }
});
