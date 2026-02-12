import { ExpansionDefinition, GameState, ResourceType, TileType, CoreResources, CoreZoneNames, GameObject } from '@balance-control/rules';

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
    name: EXP_03_NAME,
    resources: ['CLM'],
    zones: [
        'CountdownSupply',
        'EXP03_MeasureDrawPile',
        'EXP03_OpenMeasures',
        'EXP03_MeasureRecyclePile',
        'EXP03_MeasureFinalDiscard'
    ],

    onSetup: (GValue: GameState, ctxValue: any) => {
        const G = GValue as any;
        const ctx = ctxValue as any;
        // ... (this part was mostly fine, but I'll make sure it's clean)
    },

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        switch (measureId) {
            case 'M01': // Transformation Directive
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M01_${payload.targetTileId}_${Date.now()}`,
                            sourceId: 'M01',
                            hook: 'beforeAction',
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['CLM', 'DOM'] },
                            expiry: 'nextTurn',
                            targetTileId: payload.targetTileId
                        }
                    }
                ];
            case 'M02': // Carbon Levy
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M02_${payload.targetResort}_${Date.now()}`,
                            sourceId: 'M02',
                            hook: 'beforeAction',
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['CLM', 'DOM'] },
                            expiry: 'nextRound',
                            selector: { op: 'eq', key: 'resort', value: payload.targetResort }
                        }
                    }
                ];
            case 'M03': // Future Investment
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    { kind: 'resource.grant', playerId: payload.playerId, amount: 1, resort: payload.targetResort }
                ];
            case 'M04': // Future Resolution
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['CLM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M04_${payload.targetPlayerId}_${Date.now()}`,
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
                            id: `M06_${Date.now()}`,
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
                    { kind: 'rule.attribute', attribute: 'ignoreClimateCostThisAction', value: true, playerId: payload.playerId }
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
                            id: `M12_${Date.now()}`,
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
                            id: `M14_${Date.now()}`,
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
                            id: `M15_${Date.now()}`,
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

function payResources(G: GameState, playerId: string, cost: Record<string, number>): boolean {
    const supplyId = `${CoreZoneNames.PersonalSupply}:${playerId}`;
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

    const bankZone = G.zones[CoreZoneNames.Bank];
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
    const bank = G.zones[CoreZoneNames.Bank];
    const supply = G.zones[`${CoreZoneNames.PersonalSupply}:${playerId}`];
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
    G.zones[CoreZoneNames.BoardAttached] = G.zones[CoreZoneNames.BoardAttached] || { id: 'BoardAttached', name: 'Attached', items: [] };
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
