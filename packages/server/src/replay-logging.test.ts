import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyReplayRecords, type ReplayNdjsonRecord, type ReplayRecord } from '@balance-control/game';
import { createReplayFilename, createReplaySink } from './replay-logging';

type ReplaySinkLike = {
    writeRecord(record: ReplayRecord): void;
    close(): void;
};

async function readSingleReplayFile(directory: string): Promise<ReplayNdjsonRecord[]> {
    const deadline = Date.now() + 1000;

    while (Date.now() < deadline) {
        const files = fs.readdirSync(directory).filter((name) => name.endsWith('.replay.ndjson'));
        if (files.length === 1) {
            const replayPath = path.join(directory, files[0]);
            if (fs.existsSync(replayPath)) {
                const text = fs.readFileSync(replayPath, 'utf8').trim();
                if (text.length > 0) {
                    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
                    return lines.map((line) => JSON.parse(line) as ReplayNdjsonRecord);
                }
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error('Expected replay output file to be present and non-empty.');
}

async function runOneActionReplay(directory: string, checkpointEveryActions?: number): Promise<ReplayNdjsonRecord[]> {
    const sink = createReplaySink({ replayDirectory: directory, checkpointEveryActions }) as ReplaySinkLike;
    const actionRecord: ReplayRecord = {
        recordType: 'action',
        seq: 1,
        player: '0',
        moveType: 'placeTile',
        args: [{ targetCoord: '1,0' }],
        turn: 0,
        phase: 'drawAndPlace',
        matchId: 'test-match',
        seed: 'replay-verify-seed',
        matchConfig: {
            players: 3,
            expansions: {
                ex01: false,
                ex02: false,
                ex03: false,
            },
        },
        expansions: [],
        stateHash: 'a'.repeat(64),
    };

    sink.writeRecord(actionRecord);
    sink.close();

    return await readSingleReplayFile(directory);
}

describe('createReplayFilename', () => {
    it('includes replay seed from record in generated filename', () => {
        const fileName = createReplayFilename(
            {
                recordType: 'action',
                seq: 1,
                player: '0',
                moveType: 'placeInfluence',
                args: [],
                matchId: 'match-seed',
                seed: 'seed-abc-123',
            },
            new Date('2026-03-08T12:34:56.000Z')
        );

        expect(fileName).toContain('match-seed-seed-abc-123-');
        expect(fileName).toBe('match-seed-seed-abc-123-20260308T123456Z.replay.ndjson');
    });
});

describe('NdjsonReplaySink v1 boundaries', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        for (const dir of tempDirs) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    function makeTempDir(): string {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-replay-'));
        tempDirs.push(dir);
        return dir;
    }

    it('writes header first, footer last, and action seq compatible with verifier', async () => {
        const directory = makeTempDir();
        const records = await runOneActionReplay(directory);

        expect(records[0]).toMatchObject({ recordType: 'header', schemaVersion: '1' });
        expect(records.at(-1)).toMatchObject({ recordType: 'footer', totalActions: 1 });

        const action = records.find((record) => record.recordType === 'action');
        expect(action && action.recordType === 'action' ? action.seq : -1).toBe(1);
    });

    it('writes checkpoint records when checkpoint cadence is configured', async () => {
        const directory = makeTempDir();
        const records = await runOneActionReplay(directory, 1);

        const checkpoint = records.find((record) => record.recordType === 'checkpoint');
        expect(checkpoint).toMatchObject({ recordType: 'checkpoint', afterSeq: 1 });
    });

    it('replay file verifies end-to-end with replay verifier', async () => {
        const directory = makeTempDir();
        const records = await runOneActionReplay(directory);

        const result = verifyReplayRecords(records);
        expect(result.totalActions).toBe(1);
        expect(result.finalStateHash).toMatch(/^[a-f0-9]{64}$/);
    });


    it('throws on close when no non-empty stateHash was observed for footer emission', async () => {
        const directory = makeTempDir();
        const sink = createReplaySink({ replayDirectory: directory }) as ReplaySinkLike;

        sink.writeRecord({
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            turn: 0,
            phase: 'drawAndPlace',
            matchId: 'missing-footer-hash-match',
            seed: 'missing-footer-hash-seed',
            matchConfig: { players: 2 },
        });

        expect(() => sink.close()).toThrowError(/missing required finalStateHash/);

        await new Promise((resolve) => setTimeout(resolve, 25));
    });


    it('captures expansions once from the first valid metadata record before header emission', async () => {
        const directory = makeTempDir();
        const sink = createReplaySink({ replayDirectory: directory }) as ReplaySinkLike & {
            ensureStream(streamKey: string, record: ReplayRecord): {
                stream: fs.WriteStream;
                actionCount: number;
                headerWritten: boolean;
                lastStateHash?: string;
                expansions?: string[];
            };
            captureHeaderMetadata(
                streamState: {
                    stream: fs.WriteStream;
                    actionCount: number;
                    headerWritten: boolean;
                    lastStateHash?: string;
                    expansions?: string[];
                },
                record: ReplayRecord
            ): void;
            ensureHeader(streamState: {
                stream: fs.WriteStream;
                actionCount: number;
                headerWritten: boolean;
                lastStateHash?: string;
                expansions?: string[];
            }): void;
        };

        const firstRecordWithoutExpansions: ReplayRecord = {
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            turn: 0,
            phase: 'drawAndPlace',
            matchId: 'late-expansion-match',
            seed: 'late-expansion-seed',
            matchConfig: { players: 2 },
            stateHash: 'b'.repeat(64),
        };

        const laterRecordWithExpansions: ReplayRecord = {
            recordType: 'action',
            seq: 2,
            player: '1',
            moveType: 'placeInfluence',
            args: [{ targetCoord: '2,0' }],
            turn: 0,
            phase: 'drawAndPlace',
            matchId: 'late-expansion-match',
            expansions: ['exp03', 'exp01', 'exp03'],
            stateHash: 'c'.repeat(64),
        };

        const streamState = sink.ensureStream('late-expansion-match', firstRecordWithoutExpansions);
        expect(streamState.expansions).toBeUndefined();

        sink.captureHeaderMetadata(streamState, firstRecordWithoutExpansions);
        expect(streamState.expansions).toBeUndefined();

        sink.captureHeaderMetadata(streamState, laterRecordWithExpansions);
        expect(streamState.expansions).toEqual(['exp01', 'exp03']);

        sink.ensureHeader(streamState);
        streamState.lastStateHash = 'c'.repeat(64);
        sink.close();

        const records = await readSingleReplayFile(directory);
        const header = records[0];
        expect(header).toMatchObject({ recordType: 'header', expansions: ['exp01', 'exp03'] });
    });

    it('writes header with required seed and matchConfig metadata when captured before emission', async () => {
        const directory = makeTempDir();
        const sink = createReplaySink({ replayDirectory: directory }) as ReplaySinkLike;

        sink.writeRecord({
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            turn: 0,
            phase: 'drawAndPlace',
            matchId: 'header-required-metadata',
            seed: 'header-required-seed',
            matchConfig: { players: 2, mode: 'hotseat' },
            stateHash: 'd'.repeat(64),
        });

        sink.close();

        const records = await readSingleReplayFile(directory);
        expect(records[0]).toMatchObject({
            recordType: 'header',
            schemaVersion: '1',
            seed: 'header-required-seed',
            matchConfig: { players: 2, mode: 'hotseat' },
        });
    });

    it('throws descriptive error when required header metadata is missing', async () => {
        const directory = makeTempDir();
        const sink = createReplaySink({ replayDirectory: directory }) as ReplaySinkLike;

        expect(() => {
            sink.writeRecord({
                recordType: 'action',
                seq: 1,
                player: '0',
                moveType: 'placeTile',
                args: [{ targetCoord: '1,0' }],
                turn: 0,
                phase: 'drawAndPlace',
                matchId: 'missing-metadata-match',
                stateHash: 'e'.repeat(64),
            });
        }).toThrowError(
            'Cannot write replay header for stream "missing-metadata-match" (matchId="missing-metadata-match"): missing required metadata seed, matchConfig.'
        );

        await new Promise((resolve) => setTimeout(resolve, 25));
    });
});
