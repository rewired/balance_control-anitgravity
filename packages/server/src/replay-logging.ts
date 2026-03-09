import fs from 'node:fs';
import path from 'node:path';
import type { ReplayRecord, ReplaySink } from '@balance-control/game';

const DEFAULT_REPLAY_DIRECTORY_SEGMENTS = ['log', 'replay'] as const;
const FILE_EXTENSION = '.replay.ndjson';
const SAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]/g;
const WORKSPACE_ROOT_MARKER = 'pnpm-workspace.yaml';

export type ReplayLoggingConfig = Readonly<{ replayDirectory?: string; checkpointEveryActions?: number }>;

type ReplayHeaderRecord = Readonly<{ recordType: 'header'; schemaVersion: '2'; format: 'balance-control.replay.jsonl'; seed: string; matchConfig: Record<string, unknown>; expansions: string[]; loggingMode: string }>;
type ReplayFooterRecord = Readonly<{ recordType: 'footer'; finalStateHash: string; totalActions: number; totalRecords: number }>;
export type CloseableReplaySink = ReplaySink & Required<Pick<ReplaySink, 'close'>>;

type StreamState = { streamKey: string; matchId?: string; stream: fs.WriteStream; actionCount: number; totalRecords: number; lastStateHash?: string; headerWritten: boolean; manifestWritten: boolean; seed?: string; matchConfig?: Record<string, unknown>; expansions?: string[]; loggingMode?: string };

const sanitizeFilenamePart = (value: string, fallback: string) => (value.trim().replace(SAFE_FILENAME_CHARS, '_') || fallback);
const formatUtcTimestamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
function findWorkspaceRoot(startDirectory: string): string { let current = path.resolve(startDirectory); while (true) { if (fs.existsSync(path.join(current, WORKSPACE_ROOT_MARKER))) return current; const parent = path.dirname(current); if (parent === current) return startDirectory; current = parent; } }
const getDefaultReplayDirectory = (cwd: string) => path.join(findWorkspaceRoot(cwd), ...DEFAULT_REPLAY_DIRECTORY_SEGMENTS);
const normalizeExpansions = (value: readonly string[] | undefined): string[] => !value ? [] : [...new Set(value)].sort((a, b) => a.localeCompare(b));
const writeNdjsonLine = (stream: fs.WriteStream, record: unknown): void => { stream.write(`${JSON.stringify(record)}\n`); };

export function resolveReplayDirectory(inputPath?: string, currentWorkingDirectory = process.cwd()): string {
    const configured = inputPath?.trim(); if (!configured) return path.normalize(getDefaultReplayDirectory(currentWorkingDirectory));
    if (configured.includes('\u0000')) throw new Error('Invalid replay directory: path must not contain null bytes.');
    const normalizedInput = path.posix.normalize(configured.replace(/\\/g, '/'));
    if (!path.isAbsolute(configured) && (normalizedInput === '..' || normalizedInput.startsWith('../') || normalizedInput.includes('/../'))) throw new Error(`Invalid replay directory "${configured}": path traversal ("..") is not allowed for relative replay paths.`);
    return path.normalize(path.resolve(currentWorkingDirectory, configured));
}

export function createReplayFilename(record: ReplayRecord, timestamp: Date = new Date()): string {
    const matchIdPart = sanitizeFilenamePart((record as any).matchId ?? 'unknown-match', 'unknown-match');
    const seedPart = sanitizeFilenamePart((record as any).seed ?? 'unknown-seed', 'unknown-seed');
    return `${matchIdPart}-${seedPart}-${formatUtcTimestamp(timestamp)}${FILE_EXTENSION}`;
}

class NdjsonReplaySink implements CloseableReplaySink {
    private readonly streams = new Map<string, StreamState>();
    public constructor(private readonly replayDirectory: string) { }
    public writeRecord(record: ReplayRecord): void {
        const streamKey = (record as any).matchId ?? '__unknown_match__';
        const state = this.ensureStream(streamKey, record);
        this.captureMetadata(state, record);
        this.ensureHeader(state);
        if (record.recordType === 'manifest' && !state.manifestWritten) {
            const { seed: _seed, matchConfig: _cfg, expansions: _exp, loggingMode: _mode, ...manifestRecord } = record as any;
            writeNdjsonLine(state.stream, manifestRecord);
            state.totalRecords += 1;
            state.manifestWritten = true;
            return;
        }
        writeNdjsonLine(state.stream, record);
        state.totalRecords += 1;
        if (record.recordType === 'action') state.actionCount += 1;
        const hash = (record as any).postActionStateHash ?? (record as any).postSettlementStateHash ?? (record as any).stateHash;
        if (typeof hash === 'string' && hash.length > 0) state.lastStateHash = hash;
    }
    public close(): void {
        for (const state of this.streams.values()) {
            this.ensureHeader(state);
            if (!state.manifestWritten) throw new Error(`Cannot close replay stream "${state.streamKey}": manifest record was not written.`);
            if (!state.lastStateHash) throw new Error(`Cannot write replay footer for stream "${state.streamKey}": missing required finalStateHash.`);
            const footer: ReplayFooterRecord = { recordType: 'footer', finalStateHash: state.lastStateHash, totalActions: state.actionCount, totalRecords: state.totalRecords + 2 };
            writeNdjsonLine(state.stream, footer);
            state.stream.end();
        }
        this.streams.clear();
    }
    private captureMetadata(state: StreamState, record: ReplayRecord): void {
        if (record.recordType !== 'manifest') return;
        if (typeof (record as any).seed === 'string') state.seed = (record as any).seed;
        if ((record as any).matchConfig && typeof (record as any).matchConfig === 'object') state.matchConfig = (record as any).matchConfig;
        if (Array.isArray((record as any).expansions)) state.expansions = normalizeExpansions((record as any).expansions);
        if (typeof (record as any).loggingMode === 'string') state.loggingMode = (record as any).loggingMode;
    }
    private ensureHeader(state: StreamState): void {
        if (state.headerWritten) return;
        if (!state.seed || !state.matchConfig) throw new Error(`Cannot write replay header for stream "${state.streamKey}" (matchId="${state.matchId ?? 'unknown-match'}"): missing required metadata seed, matchConfig.`);
        const header: ReplayHeaderRecord = { recordType: 'header', schemaVersion: '2', format: 'balance-control.replay.jsonl', seed: state.seed, matchConfig: state.matchConfig, expansions: normalizeExpansions(state.expansions), loggingMode: state.loggingMode ?? 'canonical' };
        writeNdjsonLine(state.stream, header); state.totalRecords += 1; state.headerWritten = true;
    }
    private ensureStream(streamKey: string, record: ReplayRecord): StreamState {
        const existing = this.streams.get(streamKey); if (existing) return existing;
        const stream = fs.createWriteStream(path.join(this.replayDirectory, createReplayFilename(record)), { flags: 'a', encoding: 'utf8' });
        const state: StreamState = { streamKey, matchId: (record as any).matchId, stream, actionCount: 0, totalRecords: 0, headerWritten: false, manifestWritten: false };
        this.streams.set(streamKey, state); return state;
    }
}

export function createReplaySink(config: ReplayLoggingConfig): CloseableReplaySink { const replayDirectory = resolveReplayDirectory(config.replayDirectory); fs.mkdirSync(replayDirectory, { recursive: true }); return new NdjsonReplaySink(replayDirectory); }
export function readReplayDirectoryFromEnv(env = process.env): string | undefined { return env.BC_REPLAY_DIRECTORY; }
