import fs from 'node:fs';
import path from 'node:path';
import type { ReplayRecord, ReplaySink } from '@balance-control/game';

const DEFAULT_REPLAY_DIRECTORY_SEGMENTS = ['log', 'replay'] as const;
const FILE_EXTENSION = '.replay.ndjson';
const SAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]/g;
const WORKSPACE_ROOT_MARKER = 'pnpm-workspace.yaml';

type ReplayLoggingConfig = Readonly<{
    replayDirectory?: string;
}>;

function sanitizeFilenamePart(value: string, fallback: string): string {
    const sanitized = value.trim().replace(SAFE_FILENAME_CHARS, '_');
    return sanitized.length > 0 ? sanitized : fallback;
}

function formatUtcTimestamp(date: Date): string {
    const iso = date.toISOString();
    return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function findWorkspaceRoot(startDirectory: string): string {
    let current = path.resolve(startDirectory);

    while (true) {
        const markerPath = path.join(current, WORKSPACE_ROOT_MARKER);
        if (fs.existsSync(markerPath)) {
            return current;
        }

        const parent = path.dirname(current);
        if (parent === current) {
            return startDirectory;
        }

        current = parent;
    }
}

function getDefaultReplayDirectory(currentWorkingDirectory: string): string {
    const workspaceRoot = findWorkspaceRoot(currentWorkingDirectory);
    return path.join(workspaceRoot, ...DEFAULT_REPLAY_DIRECTORY_SEGMENTS);
}

/**
 * Validates and resolves replay output directory.
 * Rejects relative path traversal and invalid empty paths.
 */
export function resolveReplayDirectory(inputPath?: string, currentWorkingDirectory = process.cwd()): string {
    const configured = inputPath?.trim();
    if (!configured) {
        return path.normalize(getDefaultReplayDirectory(currentWorkingDirectory));
    }

    if (configured.includes('\u0000')) {
        throw new Error('Invalid replay directory: path must not contain null bytes.');
    }

    const normalizedInput = path.posix.normalize(configured.replace(/\\/g, '/'));
    if (!path.isAbsolute(configured)) {
        if (normalizedInput === '..' || normalizedInput.startsWith('../') || normalizedInput.includes('/../')) {
            throw new Error(
                `Invalid replay directory "${configured}": path traversal ("..") is not allowed for relative replay paths.`
            );
        }
    }

    const resolved = path.resolve(currentWorkingDirectory, configured);
    return path.normalize(resolved);
}

export function createReplayFilename(record: ReplayRecord, timestamp: Date = new Date()): string {
    const matchIdPart = sanitizeFilenamePart(record.matchId ?? 'unknown-match', 'unknown-match');
    const seedPart = sanitizeFilenamePart(record.seed ?? 'unknown-seed', 'unknown-seed');
    const timestampPart = formatUtcTimestamp(timestamp);
    return `${matchIdPart}-${seedPart}-${timestampPart}${FILE_EXTENSION}`;
}

class NdjsonReplaySink implements ReplaySink {
    private readonly streams = new Map<string, fs.WriteStream>();

    public constructor(private readonly replayDirectory: string) { }

    public writeRecord(record: ReplayRecord): void {
        const streamKey = record.matchId ?? '__unknown_match__';
        const stream = this.ensureStream(streamKey, record);
        stream.write(`${JSON.stringify(record)}\n`);
    }

    public close(): void {
        for (const stream of this.streams.values()) {
            stream.end();
        }
        this.streams.clear();
    }

    private ensureStream(streamKey: string, record: ReplayRecord): fs.WriteStream {
        const existing = this.streams.get(streamKey);
        if (existing) {
            return existing;
        }

        const fileName = createReplayFilename(record);
        const outputFile = path.join(this.replayDirectory, fileName);
        const stream = fs.createWriteStream(outputFile, { flags: 'a', encoding: 'utf8' });
        this.streams.set(streamKey, stream);
        return stream;
    }
}

export function createReplaySink(config: ReplayLoggingConfig): ReplaySink {
    const replayDirectory = resolveReplayDirectory(config.replayDirectory);
    fs.mkdirSync(replayDirectory, { recursive: true });
    return new NdjsonReplaySink(replayDirectory);
}

export function readReplayDirectoryFromEnv(env = process.env): string | undefined {
    return env.BC_REPLAY_DIRECTORY;
}
