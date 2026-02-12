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

    onSetup: (G: GameState, ctx: any) => {
        // 1. Initialize Zones
        G.zones.CountdownSupply = { id: 'CountdownSupply', name: 'Countdown Supply', items: [] };
        G.zones.EXP03_MeasureDrawPile = { id: 'EXP03_MeasureDrawPile', name: 'EXP-03 Measure Draw Pile', items: [] };
        G.zones.EXP03_MeasureRecyclePile = { id: 'EXP03_MeasureRecyclePile', name: 'EXP-03 Measure Recycle Pile', items: [] };
        G.zones.EXP03_MeasureFinalDiscard = { id: 'EXP03_MeasureFinalDiscard', name: 'EXP-03 Measure Final Discard', items: [] };
        G.zones.EXP03_OpenMeasures = { id: 'EXP03_OpenMeasures', name: 'EXP-03 Open Measures', items: [] };

        // 2. Add CLM ResortTiles
        const addClmResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = `tile_clm_w${weight}_${i}_${Math.random().toString(36).substr(2, 5)}`;
                G.tiles[id] = { id, type: TileType.Resort, resort: 'CLM', weight, name: `CLM W${weight}` };
                G.zones[CoreZoneNames.DrawPile].items.push(id);
                G.zones[id] = { id, name: `CLM W${weight}`, items: [] };
            }
        };
        addClmResort(1, 2); addClmResort(2, 2);
        if (ctx.numPlayers >= 5) {
            addClmResort(1, 1); addClmResort(2, 1);
        }

        // 3. Add Transformationsdruck Hotspot
        const transId = 'tile_transformationsdruck';
        G.tiles[transId] = { id: transId, type: TileType.Hotspot, name: 'Transformationsdruck', isHotspot: true };
        G.zones[CoreZoneNames.DrawPile].items.push(transId);
        G.zones[transId] = { id: transId, name: 'Transformationsdruck', items: [] };

        // 4. Initialize Measures
        MEASURE_IDS.forEach(mId => {
            const objId = `exp03_measure_${mId}`;
            G.objects[objId] = { id: objId, type: 'Measure', measureId: mId, playCount: 0 };
            G.zones.EXP03_MeasureDrawPile.items.push(objId);
        });

        // 5. Initialize Countdown Markers (Unlimited supply implied but we'll start with 20)
        for (let i = 0; i < 20; i++) {
            const id = `countdown_${i}`;
            G.objects[id] = { id, type: 'CountdownMarker' };
            G.zones.CountdownSupply.items.push(id);
        }

        // 6. Shuffle and deal 3
        if (ctx && (ctx as any).random) {
            G.zones.EXP03_MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.EXP03_MeasureDrawPile.items);
        }
        for (let i = 0; i < 3; i++) {
            const mId = G.zones.EXP03_MeasureDrawPile.items.pop();
            if (mId) G.zones.EXP03_OpenMeasures.items.push(mId);
        }
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
        'PLAY_MEASURE_EXP03': (G: GameState, ctx: any, effect: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const obj = G.objects[measureObjectId];
            if (!obj || obj.type !== 'Measure') return;
            const mId = obj.measureId!;
            const { cost } = MEASURE_DETAILS[mId];

            if (!payResources(G, playerId, cost)) return;

            if (!G.secret.exp03) G.secret.exp03 = {};

            switch (mId) {
                case 'M01': // Transformation Directive: Cost increase on Tile
                    if (!G.secret.exp03.tileCostIncreases) G.secret.exp03.tileCostIncreases = {};
                    G.secret.exp03.tileCostIncreases[effect.payload.targetTileId] = {
                        owner: playerId,
                        until: 'nextTurn'
                    };
                    break;
                case 'M02': // Carbon Levy: Cost increase on Resort
                    if (!G.secret.exp03.resortCostIncreases) G.secret.exp03.resortCostIncreases = {};
                    G.secret.exp03.resortCostIncreases[effect.payload.targetResort] = {
                        owner: playerId,
                        until: 'endNextRound'
                    };
                    break;
                case 'M03': // Future Investment: Gain 1 specific resource
                    grantResource(G, playerId, effect.payload.targetResort);
                    break;
                case 'M04': // Future Resolution: No PlayMeasure next turn
                    if (!G.secret.nextRoundProhibitions) G.secret.nextRoundProhibitions = {};
                    G.secret.nextRoundProhibitions[effect.payload.targetPlayerId] = { noPlayMeasure: true };
                    break;
                case 'M05': // Greenwashing: Effects do not generate Influence
                    G.secret.exp03.noInfluenceUntilNextTurn = true;
                    break;
                case 'M06': // Energy Crisis: ConvertResources +1 DOM
                    G.secret.exp03.convertCostIncrease = true;
                    break;
                case 'M07': // Protest Movement: Majority no Influence
                    G.secret.exp03.noMajorityInfluenceUntilNextTurn = true;
                    break;
                case 'M08': // Adaptation Strategy: Ignore Climate cost increases
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].ignoreClimateCosts = true;
                    break;
                case 'M09': // Technology Initiative: Ignore Climate cost for THIS action
                    // This is usually handled by the move engine looking at a flag
                    G.secret.exp03.ignoreClimateCostThisAction = true;
                    break;
                case 'M10': // Future Pact: Climate measures don't impose costs on you
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].climateImmunity = true;
                    break;
                case 'M11': // Supply Chain Disruption: Max 1 resource per production
                    if (!G.secret.exp03.productionCaps) G.secret.exp03.productionCaps = {};
                    G.secret.exp03.productionCaps[effect.payload.targetPlayerId] = 1;
                    break;
                case 'M12': // Extreme Weather Event: Placing ResortTiles +1 CLM/DOM
                    G.secret.exp03.placeResortCostIncrease = true;
                    break;
                case 'M13': // Intergenerational Pact: Transfer 1 cost component
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].transferableCost = true;
                    break;
                case 'M14': // Transformation Blockade: Placement of Countdown +1 CLM/DOM
                    G.secret.exp03.placeCountdownCostIncrease = true;
                    break;
                case 'M15': // Future Committee: Placement of Countdown pays +1 CLM/DOM
                    G.secret.exp03.placeCountdownAddedCost = true;
                    break;
            }

            recycleMeasureEXP03(G, measureObjectId, playerId);
        },
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            if (effect.payload.tileId === 'tile_transformationsdruck') {
                const result = utils?.computeMajority?.(effect.payload.tileId, G);
                if (result?.controller) {
                    const pid = result.controller;
                    // Transformationsdruck resolution: Place a Countdown Marker
                    // Payload might contain instructions but spec says "When explicitly instructed"
                    // We'll provide a sub-move or action for the winner.
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
