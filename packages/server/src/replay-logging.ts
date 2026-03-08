import fs from 'node:fs';
import path from 'node:path';
import type { ReplayRecord, ReplaySink } from '@balance-control/game';

const DEFAULT_REPLAY_DIRECTORY_SEGMENTS = ['log', 'replay'] as const;
const FILE_EXTENSION = '.replay.ndjson';
const SAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]/g;
const WORKSPACE_ROOT_MARKER = 'pnpm-workspace.yaml';

type ReplayLoggingConfig = Readonly<{
    replayDirectory?: string;
    checkpointEveryActions?: number;
}>;

type ReplayHeaderRecord = Readonly<{
    recordType: 'header';
    schemaVersion: '1';
    seed: string;
    matchConfig: Record<string, unknown>;
    expansions: string[];
}>;

type ReplayCheckpointRecord = Readonly<{
    recordType: 'checkpoint';
    stateHash: string;
    afterSeq: number;
}>;

type ReplayFooterRecord = Readonly<{
    recordType: 'footer';
    finalStateHash: string;
    totalActions: number;
}>;

type StreamState = {
    stream: fs.WriteStream;
    actionCount: number;
    lastStateHash?: string;
    headerWritten: boolean;
    seed?: string;
    matchConfig?: Record<string, unknown>;
    expansions?: string[];
};

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

function normalizeExpansions(value: readonly string[] | undefined): string[] {
    if (!value) return [];
    const sorted = [...new Set(value)].sort((a, b) => a.localeCompare(b));
    return sorted;
}

function writeNdjsonLine(stream: fs.WriteStream, record: ReplayRecord | ReplayHeaderRecord | ReplayCheckpointRecord | ReplayFooterRecord): void {
    stream.write(`${JSON.stringify(record)}\n`);
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
    private readonly streams = new Map<string, StreamState>();

    public constructor(private readonly replayDirectory: string, private readonly checkpointEveryActions?: number) { }

    public writeRecord(record: ReplayRecord): void {
        const streamKey = record.matchId ?? '__unknown_match__';
        const streamState = this.ensureStream(streamKey, record);
        this.captureHeaderMetadata(streamState, record);
        this.ensureHeader(streamState);

        writeNdjsonLine(streamState.stream, record);

        if (record.recordType === 'action') {
            streamState.actionCount += 1;
            this.maybeWriteCheckpoint(streamState, record.seq, record.stateHash);
        }

        if (typeof record.stateHash === 'string') {
            streamState.lastStateHash = record.stateHash;
        }
    }

    public close(): void {
        for (const streamState of this.streams.values()) {
            this.ensureHeader(streamState);
            const footer: ReplayFooterRecord = {
                recordType: 'footer',
                finalStateHash: streamState.lastStateHash ?? '',
                totalActions: streamState.actionCount,
            };
            writeNdjsonLine(streamState.stream, footer);
            streamState.stream.end();
        }
        this.streams.clear();
    }

    private maybeWriteCheckpoint(streamState: StreamState, afterSeq: number, stateHash?: string): void {
        if (!this.checkpointEveryActions || this.checkpointEveryActions <= 0) return;
        if (streamState.actionCount % this.checkpointEveryActions !== 0) return;
        if (typeof stateHash !== 'string' || stateHash.length === 0) return;

        const checkpoint: ReplayCheckpointRecord = {
            recordType: 'checkpoint',
            afterSeq,
            stateHash,
        };
        writeNdjsonLine(streamState.stream, checkpoint);
    }

    private captureHeaderMetadata(streamState: StreamState, record: ReplayRecord): void {
        if (!streamState.seed && typeof record.seed === 'string') {
            streamState.seed = record.seed;
        }
        if (!streamState.matchConfig && record.matchConfig && typeof record.matchConfig === 'object') {
            streamState.matchConfig = record.matchConfig;
        }
        if (typeof streamState.expansions === 'undefined' && Array.isArray(record.expansions)) {
            streamState.expansions = normalizeExpansions(record.expansions);
        }
    }

    private ensureHeader(streamState: StreamState): void {
        if (streamState.headerWritten) return;

        const header: ReplayHeaderRecord = {
            recordType: 'header',
            schemaVersion: '1',
            seed: streamState.seed ?? 'unknown-seed',
            matchConfig: streamState.matchConfig ?? { players: 2 },
            expansions: normalizeExpansions(streamState.expansions),
        };
        writeNdjsonLine(streamState.stream, header);
        streamState.headerWritten = true;
    }

    private ensureStream(streamKey: string, record: ReplayRecord): StreamState {
        const existing = this.streams.get(streamKey);
        if (existing) {
            return existing;
        }

        const fileName = createReplayFilename(record);
        const stream = fs.createWriteStream(path.join(this.replayDirectory, fileName), { flags: 'a', encoding: 'utf8' });
        const streamState: StreamState = {
            stream,
            actionCount: 0,
            headerWritten: false,
            seed: typeof record.seed === 'string' ? record.seed : undefined,
            matchConfig: record.matchConfig,
            expansions: Array.isArray(record.expansions) ? normalizeExpansions(record.expansions) : undefined,
        };

        this.streams.set(streamKey, streamState);
        return streamState;
    }
}

export function createReplaySink(config: ReplayLoggingConfig): ReplaySink {
    const replayDirectory = resolveReplayDirectory(config.replayDirectory);
    fs.mkdirSync(replayDirectory, { recursive: true });
    return new NdjsonReplaySink(replayDirectory, config.checkpointEveryActions);
}

export function readReplayDirectoryFromEnv(env = process.env): string | undefined {
    return env.BC_REPLAY_DIRECTORY;
}
