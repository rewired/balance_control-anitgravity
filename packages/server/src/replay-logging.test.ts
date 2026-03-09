import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type ReplayRecord } from '@balance-control/game';
import { createReplaySink } from './replay-logging';

type ReplaySinkLike = { writeRecord(record: ReplayRecord): void; close(): void };

async function readSingleReplayFile(directory: string): Promise<any[]> {
    const deadline = Date.now() + 1000;
    while (Date.now() < deadline) {
        const files = fs.readdirSync(directory).filter((name) => name.endsWith('.replay.ndjson'));
        if (files.length === 1) {
            const text = fs.readFileSync(path.join(directory, files[0]), 'utf8').trim();
            if (text.length > 0) return text.split(/\r?\n/).map((line) => JSON.parse(line));
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Expected replay output file to be present and non-empty.');
}

describe('NdjsonReplaySink v2 boundaries', () => {
    const tempDirs: string[] = [];
    afterEach(() => { for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true }); });
    function makeTempDir(): string { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-replay-')); tempDirs.push(dir); return dir; }

    it('writes header + manifest + events + footer', async () => {
        const directory = makeTempDir();
        const sink = createReplaySink({ replayDirectory: directory }) as ReplaySinkLike;
        sink.writeRecord({ recordType: 'manifest', matchId: 'm1', seed: 's1', matchConfig: { players: 2 }, expansions: [], loggingMode: 'canonical', tiles: {}, playerSeats: {}, resourceTypes: [] } as any);
        sink.writeRecord({ recordType: 'action', seq: 1, round: 0, turn: 1, stage: 'drawAndPlace', player: '0', moveType: 'placeTile', intent: { targetCoord: '1,0' }, resolved: { drawnTileId: 't1' }, postActionStateHash: 'a'.repeat(64), matchId: 'm1' } as any);
        sink.close();
        const records = await readSingleReplayFile(directory);
        expect(records.map((r) => r.recordType)).toEqual(['header', 'manifest', 'action', 'footer']);
        expect(records[0]).toMatchObject({ schemaVersion: '2', format: 'balance-control.replay.jsonl' });
        expect(records[2].seed).toBeUndefined();
    });
});
