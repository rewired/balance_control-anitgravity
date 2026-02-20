import { ExpansionDefinition, GameState, ResourceType, TileType, GameObject } from '@balance-control/rules';

const EXP_01_NAME = 'EXP-01 Economy & Labor';

const CORE_ZONES = {
    PersonalSupply: 'PersonalSupply',
    DrawPile: 'DrawPile',
    Board: 'Board'
} as const;

/**
 * Canonical measure IDs for EXP-01-00.
 * @expansion EXP-01-00
 */
export const MEASURE_IDS = [
    'M01', 'M02', 'M03', 'M04', 'M05',
    'M06', 'M07', 'M08', 'M09', 'M10'
];

const MEASURE_DETAILS: Record<string, { name: string, cost: Record<string, number> }> = {
    'M01': { name: 'Budget Compromise', cost: { DOM: 1, ECO: 1, INF: 1 } },
    'M02': { name: 'Economic Stimulus', cost: { ECO: 1, FOR: 1 } },
    'M03': { name: 'Collective Bargaining', cost: { ECO: 2 } },
    'M04': { name: 'Subsidy Reduction', cost: { ECO: 1, DOM: 1 } },
    'M05': { name: 'Location Debate', cost: { ECO: 1, INF: 1 } },
    'M06': { name: 'Budget Deficit', cost: { ECO: 2 } },
    'M07': { name: 'Debt Brake', cost: { DOM: 1, ECO: 2 } },
    'M08': { name: 'Economic Council', cost: { ECO: 3 } },
    'M09': { name: 'Investment Freeze', cost: { ECO: 2, INF: 1 } },
    'M10': { name: 'Supplemental Budget', cost: { ECO: 1 } },
};

/**
 * Individual atom builders for EXP-01-00 measures.
 * @expansion EXP-01-00
 * @deterministic
 * @pure
 * @rule EXP-01-08
 */
export const MEASURE_ATOM_BUILDERS: Record<string, (G: GameState, payload: any) => any[] | null> = {
    'M01': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 3, resorts: ['DOM', 'ECO', 'INF'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, `M01_${payload.targetTileId}`),
                sourceId: 'M01',
                hook: 'onSettlement', // Or a new hook for hotspots
                effect: { kind: 'hotspot.prohibit', tileId: payload.targetTileId, window: 'thisTurn' },
                expiry: 'thisTurn',
                targetTileId: payload.targetTileId
            }
        }
    ],
    'M02': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M02'].cost.ECO, resorts: ['ECO', 'FOR'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, `M02_${payload.targetTileId}`),
                sourceId: 'M02',
                hook: 'onProduction',
                priority: 100, // Doubling runs early
                effect: {
                    kind: 'resource.grant',
                    playerId: 'CONTROLLER',
                    missingController: 'SKIP',
                    amount: 'CONTEXT_BASE',
                    resort: 'CONTEXT_RESORT',
                    context: { tileId: payload.targetTileId }
                },
                expiry: 'thisRound',
                targetTileId: payload.targetTileId
            }
        }
    ],
    'M03': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M03'].cost.ECO, resorts: ['ECO'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, 'M03'),
                sourceId: 'M03',
                hook: 'beforeAction',
                effect: { kind: 'rule.prohibit', actionType: 'CONVERT', targetResort: 'ECO' },
                expiry: 'thisRound'
            }
        }
    ],
    'M04': (G, payload) => buildM04M05(G, 'M04', payload),
    'M05': (G, payload) => buildM04M05(G, 'M05', payload),
    'M06': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M06'].cost.ECO, resorts: ['ECO'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, `M06_${payload.targetPlayerId}`),
                sourceId: 'M06',
                hook: 'beforeAction',
                priority: 10,
                playerId: payload.targetPlayerId,
                effect: { kind: 'resource.pay', playerId: payload.targetPlayerId, amount: 1, resorts: ['ANY'] },
                expiry: 'thisTurn'
            }
        }
    ],
    'M07': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M07'].cost.ECO, resorts: ['DOM', 'ECO'] },
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M07'].cost.ECO, resorts: ['ECO'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, 'M07'),
                sourceId: 'M07',
                hook: 'beforeAction',
                effect: { kind: 'rule.prohibit', actionType: 'convertResources' },
                expiry: 'nextRound'
            }
        }
    ],
    'M08': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M08'].cost.ECO, resorts: ['ECO'] },
        { kind: 'rule.attribute', attribute: `ecoSubstitute:${payload.playerId}`, value: true }
    ],
    'M09': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M09'].cost.ECO, resorts: ['ECO', 'INF'] },
        { kind: 'rule.attribute', attribute: `ignoreMeasureModifiers:${payload.targetPlayerId}`, value: true }
    ],
    'M10': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M10'].cost.ECO, resorts: ['ECO'] },
        { kind: 'rule.attribute', attribute: `ignoreCostIncrease:${payload.playerId}`, value: true, context: { expiry: 'thisTurn' } }
    ],
};

function buildM04M05(G: GameState, measureId: string, payload: any): any[] | null {
    const details = MEASURE_DETAILS[measureId];
    const costResorts = measureId === 'M04' ? ['ECO', 'DOM'] : ['ECO', 'INF'];
    const costAmount = (details.cost.ECO || 0) + (details.cost.DOM || 0) + (details.cost.INF || 0);
    return [
        { kind: 'resource.pay', playerId: payload.playerId, amount: costAmount, resorts: costResorts },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, `${measureId}_${payload.targetTileId}`),
                sourceId: measureId,
                hook: 'onProduction',
                priority: 10, // Reductions run after doubling
                effect: {
                    kind: 'resource.grant',
                    playerId: 'CONTROLLER',
                    missingController: 'SKIP',
                    amount: -1,
                    resort: 'CONTEXT_RESORT',
                    context: { tileId: payload.targetTileId }
                },
                expiry: 'thisRound',
                targetTileId: payload.targetTileId
            }
        }
    ];
}


/**
 * Expansion Definition for EXP-01-00: Economy & Labor.
 * @expansion EXP-01-00
 */
export const Expansion01: ExpansionDefinition = {
    id: 'exp01',
    name: EXP_01_NAME,
    resources: ['ECO'],
    zones: [
        'MeasureDrawPile',
        'OpenMeasures',
        'MeasureRecyclePile',
        'MeasureFinalDiscard'
    ],
    measureDecks: [
        {
            id: 'measures',
            objectIdPrefix: 'exp01_measure_',
            zones: {
                drawPileId: 'MeasureDrawPile',
                openZoneId: 'OpenMeasures',
                recyclePileId: 'MeasureRecyclePile',
                finalDiscardId: 'MeasureFinalDiscard'
            }
        }
    ],

    /**
     * EXP-01-00 Setup logic.
     * @expansion EXP-01-00
     * @deterministic
     * @sideEffects
     * @rule EXP-01-03
     */
    onSetup: (G: GameState, ctx: any) => {
        if (G.secret) G.secret.playedMeasureThisRound = {};

        // 1. Initialize Measure Zones
        G.zones.MeasureDrawPile = { id: 'MeasureDrawPile', name: 'Measure Draw Pile', items: [] };
        G.zones.MeasureRecyclePile = { id: 'MeasureRecyclePile', name: 'Measure Recycle Pile', items: [] };
        G.zones.MeasureFinalDiscard = { id: 'MeasureFinalDiscard', name: 'Measure Final Discard', items: [] };
        G.zones.OpenMeasures = { id: 'OpenMeasures', name: 'Open Measures', items: [] };

        const playerIds = Object.keys(G.zones)
            .filter(z => z.startsWith(CORE_ZONES.PersonalSupply))
            .map(z => z.split(':')[1]);

        playerIds.forEach(pid => {
            const handId = `PlayerHand:${pid}`;
            G.zones[handId] = { id: handId, name: 'Hand', items: [] };
        });

        // 2. Add ECO ResortTiles (EXP-01-02-A-01/02)
        const addEcoResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = allocId(G, `tile_eco_w${weight}_${i}`);
                G.tiles[id] = { id, type: TileType.Resort, resort: 'ECO', weight, name: `ECO W${weight}` };
                G.zones[CORE_ZONES.DrawPile].items.push(id);
                G.zones[id] = { id, name: `ECO W${weight}`, items: [] };
            }
        };

        // For 2-4 players: W1x2, W2x1, W3x1
        addEcoResort(1, 2);
        addEcoResort(2, 1);
        addEcoResort(3, 1);

        // For 5-6 players add extra: W1x1, W2x1, W3x1
        if (ctx.numPlayers >= 5) {
            addEcoResort(1, 1);
            addEcoResort(2, 1);
            addEcoResort(3, 1);
        }

        // 3. Add Labor Market Hotspot (EXP-01-02-C)
        const laborMarketId = 'tile_labor_market';
        G.tiles[laborMarketId] = {
            id: laborMarketId,
            type: TileType.Hotspot,
            name: 'Labor Market',
            isHotspot: true
        };
        G.zones[CORE_ZONES.DrawPile].items.push(laborMarketId);
        G.zones[laborMarketId] = { id: laborMarketId, name: 'Labor Market', items: [] };

        // 4. Add Investment Program (EXP-01-02-D)
        const ipId = 'tile_investment_program';
        G.tiles[ipId] = { id: ipId, type: TileType.SystemTile, name: 'Investment Program' };
        G.zones[CORE_ZONES.Board].items.push(ipId);
        // Note: System tiles usually sit on board or off board.
        // Investment Program doesn't specify grid coord, works while active.
        // We'll place it on Board zone but maybe not in grid unless needed.

        // 5. Initialize Measures (EXP-01-03)
        MEASURE_IDS.forEach(mId => {
            const objId = `exp01_measure_${mId}`;
            G.objects[objId] = {
                id: objId,
                type: 'Measure',
                measureId: mId,
                playCount: 0
            };
            G.zones.MeasureDrawPile.items.push(objId);
        });

        // 6. Shuffle and deal 3 Measures to OpenMeasures
        // 5. Shuffle and Deal
        G.zones.MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.MeasureDrawPile.items);
        for (let i = 0; i < 3; i++) {
            const mId = G.zones.MeasureDrawPile.items.pop();
            if (mId) G.zones.OpenMeasures.items.push(mId);
        }

        console.log('EXP-01 Setup Complete.');
    },

    modifiers: {
        // Porting to engine atoms soon...
    },

    /**
     * Dispatches to specific measure atom builders.
     * @expansion EXP-01-00
     * @deterministic
     * @pure
     * @rule EXP-01-07
     */
    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        const builder = MEASURE_ATOM_BUILDERS[measureId];
        return builder ? builder(G, payload) : null;
    },

    /**
     * Specialized effect handlers for EXP-01-00 triggers.
     * @expansion EXP-01-00
     */
    effectHandlers: {
        'CONVERT': (G: GameState, ctx: any, effect: any, utils: any) => {
            const { playerId, resourceIds } = effect.payload;

            // EXP-01-05-01: Investment Program (2 ECO -> 1 any)
            const ipId = 'tile_investment_program';
            const controllerResult = utils?.computeMajority?.(ipId, G) || { controller: null };
            const controller = controllerResult.controller;

            if (controller === playerId) {
                const ecoResources = resourceIds.filter((rid: string) => G.objects[rid]?.resort === 'ECO');
                if (ecoResources.length >= 2) {
                    if (effect.payload.targetResort && effect.payload.targetResort !== 'ECO') {
                        utils?.grantResources?.(G, playerId, effect.payload.targetResort, 1);
                    }
                }
            }
        },
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            // EXP-01-02-C: Labor Market
            // Majority leader receives exactly 1 Influence marker
            const laborMarketId = 'tile_labor_market';
            const result = utils?.computeMajority?.(laborMarketId, G);
            if (result?.controller) {
                const pid = result.controller;
                const infId = allocId(G, `inf_${pid}_labor`);
                G.objects[infId] = { id: infId, type: 'Influence', owner: pid };
                const supplyId = `${CORE_ZONES.PersonalSupply}:${pid}`;
                if (G.zones[supplyId]) {
                    G.zones[supplyId].items.push(infId);
                }
            }
        }
    }
};

function allocId(G: GameState, prefix: string): string {
    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}
