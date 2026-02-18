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
}

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
