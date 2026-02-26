import { describe, it, expect, beforeEach } from 'vitest';
import {
    createBalanceControlGame,
    EnginePackRegistry,
    EffectResolver,
    hashState,
} from '@balance-control/game';
import { registerCanonicalPacks } from '@balance-control/packs';
import { CoreZoneName } from '@balance-control/rules';

type ExpansionId = 'exp01' | 'exp02' | 'exp03';

interface MatrixConfig {
    id:
        | 'core'
        | 'core+exp01'
        | 'core+exp02'
        | 'core+exp03'
        | 'core+exp01+exp02'
        | 'core+exp01+exp03'
        | 'core+exp02+exp03'
        | 'core+exp01+exp02+exp03';
    enabledPacks: ExpansionId[];
}

const FIXED_SEED = 'cross-expansion-matrix-fixed-seed';

const MATRIX_CONFIGS: MatrixConfig[] = [
    { id: 'core', enabledPacks: [] },
    { id: 'core+exp01', enabledPacks: ['exp01'] },
    { id: 'core+exp02', enabledPacks: ['exp02'] },
    { id: 'core+exp03', enabledPacks: ['exp03'] },
    { id: 'core+exp01+exp02', enabledPacks: ['exp01', 'exp02'] },
    { id: 'core+exp01+exp03', enabledPacks: ['exp01', 'exp03'] },
    { id: 'core+exp02+exp03', enabledPacks: ['exp02', 'exp03'] },
    { id: 'core+exp01+exp02+exp03', enabledPacks: ['exp01', 'exp02', 'exp03'] },
];

const EXP01_ZONES = ['MeasureDrawPile', 'MeasureRecyclePile', 'MeasureFinalDiscard', 'OpenMeasures'] as const;
const EXP02_ZONES = [
    'RegulationSupply',
    'BoardAttached',
    'EXP02_MeasureDrawPile',
    'EXP02_MeasureRecyclePile',
    'EXP02_MeasureFinalDiscard',
    'EXP02_OpenMeasures',
] as const;
const EXP03_ZONES = [
    'CountdownSupply',
    'EXP03_MeasureDrawPile',
    'EXP03_MeasureRecyclePile',
    'EXP03_MeasureFinalDiscard',
    'EXP03_OpenMeasures',
] as const;

function buildState(enabledPacks: ExpansionId[]) {
    registerCanonicalPacks();

    const baseGame = createBalanceControlGame();
    const game = {
        ...baseGame,
        seed: FIXED_SEED,
        playerView: ({ G }: any) => G,
    };

    const ctx = {
        numPlayers: 2,
        playOrder: ['0', '1'],
        random: {
            Shuffle: <T>(arr: T[]) => [...arr],
            Die: () => 1,
        },
        events: {},
    };

    const G = game.setup(ctx as any, { packs: { enabledPacks } }) as any;
    return { G, ctx };
}

function expectZonePresence(G: any, zoneIds: readonly string[], shouldExist: boolean) {
    for (const zoneId of zoneIds) {
        if (shouldExist) {
            expect(G.zones[zoneId], `expected ${zoneId} to exist`).toBeDefined();
        } else {
            expect(G.zones[zoneId], `expected ${zoneId} to be absent`).toBeUndefined();
        }
    }
}

function assertNoDeadStateWhenDisabled(G: any, enabledPacks: ExpansionId[]) {
    const hasExp01 = enabledPacks.includes('exp01');
    const hasExp02 = enabledPacks.includes('exp02');
    const hasExp03 = enabledPacks.includes('exp03');

    expectZonePresence(G, EXP01_ZONES, hasExp01);
    expectZonePresence(G, EXP02_ZONES, hasExp02);
    expectZonePresence(G, EXP03_ZONES, hasExp03);

    if (!hasExp02) {
        expect(Object.keys(G.objects).some((id) => id.startsWith('reg_'))).toBe(false);
    }

    if (!hasExp03) {
        expect(Object.keys(G.objects).some((id) => id.startsWith('countdown_'))).toBe(false);
    }

    if (!hasExp01) {
        expect(Object.keys(G.objects).some((id) => id.startsWith('exp01_measure_'))).toBe(false);
    }
    if (!hasExp02) {
        expect(Object.keys(G.objects).some((id) => id.startsWith('exp02_measure_'))).toBe(false);
    }
    if (!hasExp03) {
        expect(Object.keys(G.objects).some((id) => id.startsWith('exp03_measure_'))).toBe(false);
    }

    const activeResortTiles = Object.values(G.tiles)
        .filter((tile: any) => tile?.type === 'Resort')
        .map((tile: any) => tile.resort);

    expect(activeResortTiles.includes('ECO')).toBe(hasExp01);
    expect(activeResortTiles.includes('SEC')).toBe(hasExp02);
    expect(activeResortTiles.includes('CLM')).toBe(hasExp03);
}

function assertRelevantStackCase(G: any, enabledPacks: ExpansionId[]) {
    const hasExp01 = enabledPacks.includes('exp01');
    const hasExp02 = enabledPacks.includes('exp02');
    const hasExp03 = enabledPacks.includes('exp03');

    if (hasExp02 && hasExp03) {
        const tileId = Object.keys(G.tiles).find((id) => G.tiles[id]?.type === 'Resort')!;
        G.engine.attributes.playerExtraCosts = { 0: 1 };
        G.engine.attributes.climateCostRules = [
            { type: 'action', target: 'placeInfluence', amount: 1, resorts: ['CLM'] },
            { type: 'tile', target: tileId, amount: 1 },
        ];

        const stacked = EffectResolver.getExtraCostSlots(G, '0', 'placeInfluence', tileId);
        expect(stacked).toEqual(['ANY', ['CLM'], 'ANY']);
        return;
    }

    if (hasExp02) {
        const tileId = Object.keys(G.tiles).find((id) => G.tiles[id]?.type === 'Resort')!;
        G.engine.attributes.prohibitions = {
            [tileId]: {
                placeInfluence: true,
            },
        };
        expect(EffectResolver.isProhibited(G, 'placeInfluence', '0', tileId)).toBe(true);
        return;
    }

    if (hasExp03) {
        const tileId = Object.keys(G.tiles).find((id) => G.tiles[id]?.type === 'Resort')!;
        G.engine.attributes.climateCostRules = [
            { type: 'action', target: 'placeInfluence', amount: 2, resorts: ['CLM'] },
        ];

        const climateOnly = EffectResolver.getExtraCostSlots(G, '0', 'placeInfluence', tileId);
        expect(climateOnly).toEqual([['CLM'], ['CLM']]);
        return;
    }

    if (hasExp01) {
        const drawPileItems = [...G.zones[CoreZoneName.DrawPile].items];
        const firstRunHash = hashState(G);
        G.zones[CoreZoneName.DrawPile].items = drawPileItems;
        const secondRunHash = hashState(G);
        expect(firstRunHash).toBe(secondRunHash);
        return;
    }

    const base = EffectResolver.getExtraCostSlots(G, '0', 'placeInfluence');
    expect(base).toEqual([]);
}

describe('Integration: cross-expansion matrix suite', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
    });

    for (const cfg of MATRIX_CONFIGS) {
        it(`validates deterministic init + isolation + stack case for ${cfg.id}`, () => {
            const first = buildState(cfg.enabledPacks);
            const second = buildState(cfg.enabledPacks);

            expect(hashState(first.G)).toBe(hashState(second.G));

            assertNoDeadStateWhenDisabled(first.G, cfg.enabledPacks);
            assertRelevantStackCase(first.G, cfg.enabledPacks);
        });
    }
});
