import { ExpansionDefinition, GameState, TileType } from '@balance-control/rules';

// Local constants to avoid runtime dependency on CoreZoneNames
const ZONE_PERSONAL_SUPPLY = 'PersonalSupply';
const ZONE_DRAW_PILE = 'DrawPile';
const ZONE_BANK = 'Bank';
const ZONE_BOARD_ATTACHED = 'BoardAttached';

const EXP_03_NAME = 'EXP-03 Climate & Future';

const MEASURE_IDS = [
    'M01', 'M02', 'M03', 'M04', 'M05',
    'M06', 'M07', 'M08', 'M09', 'M10',
    'M11', 'M12', 'M13', 'M14', 'M15'
];

const MEASURE_DETAILS: Record<string, { name: string, cost: Record<string, number> }> = {
    'M01': { name: 'Transformation Directive', cost: { CLM: 2 } },
    'M02': { name: 'Carbon Levy', cost: { CLM: 2 } },
    'M03': { name: 'Future Investment', cost: { CLM: 2 } },
    'M04': { name: 'Future Resolution', cost: { CLM: 2 } },
    'M05': { name: 'Greenwashing', cost: { CLM: 1, INF: 1 } },
    'M06': { name: 'Energy Crisis', cost: { CLM: 1, ECO: 1 } },
    'M07': { name: 'Protest Movement', cost: { CLM: 1 } },
    'M08': { name: 'Adaptation Strategy', cost: { CLM: 2 } },
    'M09': { name: 'Technology Initiative', cost: { CLM: 1, ECO: 1, DOM: 1 } },
    'M10': { name: 'Future Pact', cost: { CLM: 1, DOM: 1, FOR: 1 } },
    'M11': { name: 'Supply Chain Disruption', cost: { CLM: 1, ECO: 1 } },
    'M12': { name: 'Extreme Weather Event', cost: { CLM: 1 } },
    'M13': { name: 'Intergenerational Pact', cost: { CLM: 1, DOM: 1 } },
    'M14': { name: 'Transformation Blockade', cost: { CLM: 1, INF: 1 } },
    'M15': { name: 'Future Committee', cost: { CLM: 1, INF: 1, ECO: 1 } },
};

export const Expansion03: ExpansionDefinition = {
    id: 'exp03',
    name: EXP_03_NAME,
    resources: ['CLM'],
    zones: [
        'CountdownSupply',
        'EXP03_MeasureDrawPile',
        'EXP03_OpenMeasures',
        'EXP03_MeasureRecyclePile',
        'EXP03_MeasureFinalDiscard'
    ],
    measureDecks: [
        {
            id: 'measures',
            objectIdPrefix: 'exp03_measure_',
            zones: {
                drawPileId: 'EXP03_MeasureDrawPile',
                openZoneId: 'EXP03_OpenMeasures',
                recyclePileId: 'EXP03_MeasureRecyclePile',
                finalDiscardId: 'EXP03_MeasureFinalDiscard'
            }
        }
    ],

    onSetup: (GValue: GameState, ctxValue: any) => {
        const G = GValue as any;
        const ctx = ctxValue as any;

        // 1. Initialize Zones
        G.zones.CountdownSupply = { id: 'CountdownSupply', name: 'Countdown Supply', items: [] };
        G.zones.EXP03_MeasureDrawPile = { id: 'EXP03_MeasureDrawPile', name: 'EXP-03 Measure Draw Pile', items: [] };
        G.zones.EXP03_MeasureRecyclePile = { id: 'EXP03_MeasureRecyclePile', name: 'EXP-03 Measure Recycle Pile', items: [] };
        G.zones.EXP03_MeasureFinalDiscard = { id: 'EXP03_MeasureFinalDiscard', name: 'EXP-03 Measure Final Discard', items: [] };
        G.zones.EXP03_OpenMeasures = { id: 'EXP03_OpenMeasures', name: 'EXP-03 Open Measures', items: [] };

        const playerIds = Object.keys(G.zones)
            .filter(z => z.startsWith(ZONE_PERSONAL_SUPPLY))
            .map(z => z.split(':')[1]);

        playerIds.forEach(pid => {
            const handId = `PlayerHand:${pid}`;
            G.zones[handId] = { id: handId, name: 'Hand', items: [] };
        });

        // 2. Add CLM ResortTiles
        const addClmResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = allocId(G, `tile_clm_w${weight}_${i}`);
                G.tiles[id] = { id, type: TileType.Resort, resort: 'CLM', weight, name: `CLM W${weight}` };
                G.zones[ZONE_DRAW_PILE].items.push(id);
                G.zones[id] = { id, name: `CLM W${weight}`, items: [] };
            }
        };
        addClmResort(1, 2); addClmResort(2, 1); addClmResort(3, 1);
        if (ctx.numPlayers >= 5) {
            addClmResort(1, 1); addClmResort(2, 1); addClmResort(3, 1);
        }

        // 3. Add Transformation Hotspot
        const transformationId = 'tile_transformationsdruck';
        G.tiles[transformationId] = { id: transformationId, type: TileType.Hotspot, name: 'Transformation Pressure', isHotspot: true };
        G.zones[ZONE_DRAW_PILE].items.push(transformationId);
        G.zones[transformationId] = { id: transformationId, name: 'Transformation Pressure', items: [] };

        // 4. Initialize Measures
        MEASURE_IDS.forEach(mId => {
            const objId = `exp03_measure_${mId}`;
            G.objects[objId] = { id: objId, type: 'Measure', measureId: mId, playCount: 0 };
            G.zones.EXP03_MeasureDrawPile.items.push(objId);
        });

        // 5. Initialize Countdowns
        for (let i = 0; i < 10; i++) {
            const id = `countdown_${i}`;
            G.objects[id] = { id, type: 'Countdown', amount: 3 };
            G.zones.CountdownSupply.items.push(id);
        }

        // 6. Shuffle and deal
        G.zones.EXP03_MeasureDrawPile.items = ctx.random.Shuffle(G.zones.EXP03_MeasureDrawPile.items);
        for (let i = 0; i < 3; i++) {
            const mId = G.zones.EXP03_MeasureDrawPile.items.pop();
            if (mId) G.zones.EXP03_OpenMeasures.items.push(mId);
        }
    },

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        switch (measureId) {
            case 'M01': // Transformation Directive
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, `M01_${payload.targetTileId}`),
                            sourceId: 'M01',
                            hook: 'beforeAction',
                            targetTileId: payload.targetTileId,
                            effect: {
                                kind: 'rule.attribute',
                                attribute: 'climateCostRules',
                                value: { type: 'tile', target: payload.targetTileId, amount: 1, resorts: ['CLM', 'DOM'] },
                                context: { append: true }
                            },
                            expiry: 'nextTurn'
                        }
                    }
                ];
            case 'M02': // Carbon Levy
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, `M02_${payload.targetResort}`),
                            sourceId: 'M02',
                            hook: 'beforeAction',
                            effect: {
                                kind: 'rule.attribute',
                                attribute: 'climateCostRules',
                                value: { type: 'resort', target: payload.targetResort, amount: 1, resorts: ['CLM', 'DOM'] },
                                context: { append: true }
                            },
                            expiry: 'nextRound'
                        }
                    }
                ];
            case 'M03': // Future Investment
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    { kind: 'resource.grant', playerId: payload.playerId, missingController: 'SKIP', amount: 1, resort: payload.targetResort }
                ];
            case 'M04': // Future Resolution
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, `M04_${payload.targetPlayerId}`),
                            sourceId: 'M04',
                            hook: 'beforeAction',
                            playerId: payload.targetPlayerId,
                            effect: { kind: 'rule.prohibit', actionType: 'measure.play' },
                            expiry: 'nextRound'
                        }
                    }
                ];
            case 'M05': // Greenwashing
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM', 'INF'] },
                    { kind: 'rule.attribute', attribute: 'noInfluence', value: true, playerId: payload.playerId }
                ];
            case 'M06': // Energy Crisis
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM', 'ECO'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, 'M06'),
                            sourceId: 'M06',
                            hook: 'beforeAction',
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['DOM'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
            case 'M07': // Protest Movement
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['CLM'] },
                    { kind: 'rule.attribute', attribute: 'noMajorityInfluence', value: true, playerId: payload.playerId }
                ];
            case 'M08': // Adaptation Strategy
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    { kind: 'rule.attribute', attribute: 'ignoreClimateCosts', value: true, playerId: payload.playerId }
                ];
            case 'M09': // Technology Initiative
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['CLM', 'ECO', 'DOM'] },
                    { kind: 'rule.attribute', attribute: 'ignoreClimateCostThisAction', value: true }
                ];
            case 'M10': // Future Pact
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['CLM', 'DOM', 'FOR'] },
                    { kind: 'rule.attribute', attribute: 'climateImmunity', value: true, playerId: payload.playerId }
                ];
            case 'M11': // Supply Chain Disruption
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM', 'ECO'] },
                    { kind: 'rule.attribute', attribute: 'productionCap', value: 1, playerId: payload.targetPlayerId }
                ];
            case 'M12': // Extreme Weather Event
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, 'M12'),
                            sourceId: 'M12',
                            hook: 'beforeAction', // Triggered by placeTile
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['CLM', 'DOM'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
            case 'M13': // Intergenerational Pact
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['CLM', 'DOM'] },
                    { kind: 'rule.attribute', attribute: 'transferableCost', value: true, playerId: payload.playerId }
                ];
            case 'M14': // Transformation Blockade
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM', 'INF'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, 'M14'),
                            sourceId: 'M14',
                            hook: 'beforeAction', // Triggered by placeCountdown
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['CLM', 'DOM'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
            case 'M15': // Future Committee
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM', 'INF', 'ECO'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: allocId(G, 'M15'),
                            sourceId: 'M15',
                            hook: 'beforeAction',
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['CLM', 'DOM'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
        }
        return null;
    },

    effectHandlers: {
        'TAKE_MEASURE_EXP03': (G: GameState, ctx: any, effect: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const openZone = G.zones.EXP03_OpenMeasures;
            const handZone = G.zones[`PlayerHand:${playerId}`];
            const idx = openZone.items.indexOf(measureObjectId);
            if (idx >= 0) {
                openZone.items.splice(idx, 1);
                handZone.items.push(measureObjectId);
                G.objects[measureObjectId].owner = playerId;
                // Refill
                if (G.zones.EXP03_MeasureDrawPile.items.length > 0) {
                    const next = G.zones.EXP03_MeasureDrawPile.items.pop();
                    if (next) G.zones.EXP03_OpenMeasures.items.push(next);
                } else if (G.zones.EXP03_MeasureRecyclePile.items.length > 0) {
                    G.zones.EXP03_MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.EXP03_MeasureRecyclePile.items);
                    G.zones.EXP03_MeasureRecyclePile.items = [];
                    const next = G.zones.EXP03_MeasureDrawPile.items.pop();
                    if (next) G.zones.EXP03_OpenMeasures.items.push(next);
                }
            }
        },
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            if (effect.payload.tileId === 'tile_transformationsdruck') {
                const result = utils?.computeMajority?.(effect.payload.tileId, G);
                if (result?.controller) {
                    const pid = result.controller;
                    if (effect.payload.action === 'placeCountdown') {
                        placeCountdown(G, 'tile_transformationsdruck');
                    }
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

function payResources(G: GameState, playerId: string, cost: Record<string, number>): boolean {
    const supplyId = `${ZONE_PERSONAL_SUPPLY}:${playerId}`;
    const supplyZone = G.zones[supplyId];
    if (!supplyZone) return false;

    const inventory: Record<string, string[]> = {};
    supplyZone.items.forEach(id => {
        const o = G.objects[id];
        if (o && o.type === 'Resource' && o.resort) {
            if (!inventory[o.resort]) inventory[o.resort] = [];
            inventory[o.resort].push(id);
        }
    });

    for (const [res, amt] of Object.entries(cost)) {
        if ((inventory[res]?.length || 0) < amt) return false;
    }

    const bankZone = G.zones[ZONE_BANK];
    for (const [res, amt] of Object.entries(cost)) {
        for (let i = 0; i < amt; i++) {
            const rid = inventory[res].pop()!;
            supplyZone.items.splice(supplyZone.items.indexOf(rid), 1);
            bankZone.items.push(rid);
            G.objects[rid].owner = undefined;
        }
    }
    return true;
}

function grantResource(G: GameState, playerId: string, resort: string) {
    const bank = G.zones[ZONE_BANK];
    const supply = G.zones[`${ZONE_PERSONAL_SUPPLY}:${playerId}`];
    const rid = bank.items.find(id => G.objects[id].resort === resort);
    if (rid) {
        bank.items.splice(bank.items.indexOf(rid), 1);
        supply.items.push(rid);
        G.objects[rid].owner = playerId;
    }
}

function placeCountdown(G: GameState, targetTileId: string) {
    const supply = G.zones.CountdownSupply;
    if (supply.items.length === 0) return; // EXP-03-04-B-03

    const cid = supply.items.pop()!;
    G.objects[cid].targetTileId = targetTileId;
    G.zones[ZONE_BOARD_ATTACHED] = G.zones[ZONE_BOARD_ATTACHED] || { id: 'BoardAttached', name: 'Attached', items: [] };
    G.zones.BoardAttached.items.push(cid);
}

function recycleMeasureEXP03(G: GameState, measureObjectId: string, playerId: string) {
    const handId = `PlayerHand:${playerId}`;
    G.zones[handId].items = G.zones[handId].items.filter(id => id !== measureObjectId);

    const obj = G.objects[measureObjectId];
    obj.playCount = (obj.playCount || 0) + 1;
    obj.owner = undefined;

    if (obj.playCount === 1) {
        G.zones.EXP03_MeasureRecyclePile.items.push(measureObjectId);
    } else {
        G.zones.EXP03_MeasureFinalDiscard.items.push(measureObjectId);
    }
}
