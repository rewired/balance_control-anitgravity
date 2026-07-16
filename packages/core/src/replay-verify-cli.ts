#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { verifyReplayRecords, type ReplayNdjsonRecord } from './replay-verify';

function parseArgs(argv: string[]): { filePath: string; verifyCheckpoints: boolean; verifyFinalHash: boolean } {
    const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
    const positional = argv.filter((arg) => !arg.startsWith('--'));

    if (flags.has('--help') || positional.length !== 1) {
        const usage = [
            'Usage: replay-verify <replay.ndjson> [--verify-checkpoints] [--verify-final-hash]',
            '',
            'Fail-fast deterministic replay verifier:',
            '- reads header and initializes a match with identical config',
            '- executes action records strictly in sequence',
            '- optionally verifies checkpoint and footer hashes',
            '- aborts on first divergence with seq + diagnostics'
        ].join('\n');
        throw new Error(usage);
    }

    return {
        filePath: positional[0],
        verifyCheckpoints: flags.has('--verify-checkpoints'),
        verifyFinalHash: flags.has('--verify-final-hash')
    };
}

function parseNdjson(text: string): ReplayNdjsonRecord[] {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    return lines.map((line, index) => {
        try {
            return JSON.parse(line) as ReplayNdjsonRecord;
        } catch (error) {
            throw new Error(`Invalid JSON at line ${index + 1}: ${(error as Error).message}`);
        }
    });
}

function main(): void {
    const { filePath, verifyCheckpoints, verifyFinalHash } = parseArgs(process.argv.slice(2));
    const absolutePath = path.resolve(process.cwd(), filePath);
    const text = fs.readFileSync(absolutePath, 'utf8');
    const records = parseNdjson(text);

    const result = verifyReplayRecords(records, { verifyCheckpoints, verifyFinalHash });

    console.log(`OK replay verified: actions=${result.totalActions} finalStateHash=${result.finalStateHash}`);
}

try {
    main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
