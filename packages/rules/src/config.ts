import type { ExpansionId } from './ids';
import type { RulesetManifest } from './manifest';

/**
 * @deprecated Use PackSelection instead.
 * This interface is kept for compatibility but should be derived from packs.
 */
export interface ExpansionFlags {
    ex01: boolean;
    ex02: boolean;
    ex03: boolean;
}

export interface PackSelection {
    enabledPacks: ExpansionId[];
    pinnedVersions?: Partial<Record<ExpansionId, string>>;
}

export interface GameConfig {
    /** @deprecated Use packs.enabledPacks instead. */
    expansions: ExpansionFlags;
    packs?: PackSelection;
    tileRecycling?: boolean;
    firstPlayerHandicap?: boolean;
    seats?: SeatConfigMap;
}

export type SeatRole = 'human' | 'bot';

export interface BotDecodingConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
}

export interface BotTimeoutConfig {
    requestMs?: number;
    turnMs?: number;
}

export interface SeatBotConfig {
    role: 'bot';
    provider: 'ollama';
    model: string;
    decoding?: BotDecodingConfig;
    timeouts?: BotTimeoutConfig;
}

export interface SeatHumanConfig {
    role: 'human';
}

export type SeatConfig = SeatHumanConfig | SeatBotConfig;

export type SeatConfigMap = Record<string, SeatConfig>;

export type PackManifestRecord = Readonly<{
    id: string;
    packVersion: string;
    rulesetAnchor: string;
}>;

export interface GameMeta {
    ruleset?: RulesetManifest;
    /** Canonical match config snapshot (GR-012). */
    cfg?: GameConfig;
    enabledPacks?: PackManifestRecord[];
    publicSurfaceHash?: string;
}
