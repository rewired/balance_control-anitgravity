import type { ExpansionFlags, GameConfig, ExpansionId, PackSelection } from '@balance-control/rules';
export type { ExpansionFlags, GameConfig } from '@balance-control/rules';

export const DEFAULT_EXPANSION_FLAGS: ExpansionFlags = {
    ex01: false,
    ex02: false,
    ex03: false,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
    expansions: { ...DEFAULT_EXPANSION_FLAGS },
    packs: {
        enabledPacks: [],
    },
    tileRecycling: false,
    firstPlayerHandicap: false,
};

function readExpansionConfigCandidate(setupData: unknown): unknown {
    if (!setupData || typeof setupData !== 'object') return undefined;
    const source = setupData as Record<string, unknown>;

    if (source.expansions && typeof source.expansions === 'object') {
        return source.expansions;
    }

    if (source.config && typeof source.config === 'object') {
        const nested = source.config as Record<string, unknown>;
        if (nested.expansions && typeof nested.expansions === 'object') {
            return nested.expansions;
        }
    }

    return undefined;
}

function readPackConfigCandidate(setupData: unknown): Record<string, unknown> | undefined {
    if (!setupData || typeof setupData !== 'object') return undefined;
    const source = setupData as Record<string, unknown>;

    if (source.packs && typeof source.packs === 'object') {
        return source.packs as Record<string, unknown>;
    }

    if (source.config && typeof source.config === 'object') {
        const nested = source.config as Record<string, unknown>;
        if (nested.packs && typeof nested.packs === 'object') {
            return nested.packs as Record<string, unknown>;
        }
    }

    if (Array.isArray(source.enabledPacks)) {
        return {
            enabledPacks: source.enabledPacks,
            pinnedVersions: source.pinnedVersions,
        };
    }

    if (source.config && typeof source.config === 'object') {
        const nested = source.config as Record<string, unknown>;
        if (Array.isArray(nested.enabledPacks)) {
            return {
                enabledPacks: nested.enabledPacks,
                pinnedVersions: nested.pinnedVersions,
            };
        }
    }

    return undefined;
}

function readVariantConfigCandidate(setupData: unknown): Record<string, unknown> | undefined {
    if (!setupData || typeof setupData !== 'object') return undefined;
    const source = setupData as Record<string, unknown>;

    if (source.variants && typeof source.variants === 'object') {
        return source.variants as Record<string, unknown>;
    }

    if (source.coreVariants && typeof source.coreVariants === 'object') {
        return source.coreVariants as Record<string, unknown>;
    }

    if (source.config && typeof source.config === 'object') {
        const nested = source.config as Record<string, unknown>;
        if (nested.variants && typeof nested.variants === 'object') {
            return nested.variants as Record<string, unknown>;
        }
        if (nested.coreVariants && typeof nested.coreVariants === 'object') {
            return nested.coreVariants as Record<string, unknown>;
        }
    }

    return source;
}

function normalizeEnabledPacks(candidate: Record<string, unknown> | undefined): ExpansionId[] {
    if (!candidate) return [];
    const raw = candidate.enabledPacks;
    if (!Array.isArray(raw)) return [];
    const enabled: ExpansionId[] = [];
    for (const entry of raw) {
        if (entry === 'exp01' || entry === 'exp02' || entry === 'exp03') {
            enabled.push(entry);
        }
    }
    return enabled;
}

function normalizePinnedVersions(candidate: Record<string, unknown> | undefined): PackSelection['pinnedVersions'] {
    if (!candidate) return undefined;
    const raw = candidate.pinnedVersions;
    if (!raw || typeof raw !== 'object') return undefined;
    const source = raw as Record<string, unknown>;
    const next: PackSelection['pinnedVersions'] = {};
    if (typeof source.exp01 === 'string') next.exp01 = source.exp01;
    if (typeof source.exp02 === 'string') next.exp02 = source.exp02;
    if (typeof source.exp03 === 'string') next.exp03 = source.exp03;
    return Object.keys(next).length ? next : undefined;
}

function flagsToEnabledPacks(flags: ExpansionFlags): ExpansionId[] {
    const enabled: ExpansionId[] = [];
    if (flags.ex01) enabled.push('exp01');
    if (flags.ex02) enabled.push('exp02');
    if (flags.ex03) enabled.push('exp03');
    return enabled;
}

/**
 * Normalizes game configuration from setup data.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function normalizeGameConfig(setupData: unknown): GameConfig {
    const expansionsCandidate = readExpansionConfigCandidate(setupData);
    const candidate = (expansionsCandidate ?? {}) as Record<string, unknown>;
    const packCandidate = readPackConfigCandidate(setupData);
    const variantCandidate = readVariantConfigCandidate(setupData);

    const expansionsFromFlags: ExpansionFlags = {
        ex01: candidate.ex01 === true,
        ex02: candidate.ex02 === true,
        ex03: candidate.ex03 === true,
    };

    const enabledPacks = packCandidate ? normalizeEnabledPacks(packCandidate) : flagsToEnabledPacks(expansionsFromFlags);
    const expansions = packCandidate
        ? {
              ex01: enabledPacks.includes('exp01'),
              ex02: enabledPacks.includes('exp02'),
              ex03: enabledPacks.includes('exp03'),
          }
        : expansionsFromFlags;

    return {
        expansions,
        packs: {
            enabledPacks,
            pinnedVersions: normalizePinnedVersions(packCandidate),
        },
        tileRecycling: variantCandidate?.tileRecycling === true,
        firstPlayerHandicap: variantCandidate?.firstPlayerHandicap === true,
    };
}
