import { ExpansionDefinition, GameState, ResourceType, TileType, CoreResources, CoreZoneNames, GameObject } from '@balance-control/rules';

const EXP_01_NAME = 'EXP-01 Economy & Labor';

const MEASURE_IDS = [
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

export const Expansion01: ExpansionDefinition = {
    name: EXP_01_NAME,
    resources: ['ECO'],
    zones: [
        'MeasureDrawPile',
        'OpenMeasures',
        'MeasureRecyclePile',
        'MeasureFinalDiscard'
    ],

    onSetup: (G: GameState, ctx: any) => {
        if (G.secret) G.secret.playedMeasureThisRound = {};

        // 1. Initialize Measure Zones
        G.zones.MeasureDrawPile = { id: 'MeasureDrawPile', name: 'Measure Draw Pile', items: [] };
        G.zones.MeasureRecyclePile = { id: 'MeasureRecyclePile', name: 'Measure Recycle Pile', items: [] };
        G.zones.MeasureFinalDiscard = { id: 'MeasureFinalDiscard', name: 'Measure Final Discard', items: [] };
        G.zones.OpenMeasures = { id: 'OpenMeasures', name: 'Open Measures', items: [] };

        const playerIds = Object.keys(G.zones)
            .filter(z => z.startsWith(CoreZoneNames.PersonalSupply))
            .map(z => z.split(':')[1]);

        playerIds.forEach(pid => {
            const handId = `PlayerHand:${pid}`;
            G.zones[handId] = { id: handId, name: 'Hand', items: [] };
        });

        // 2. Add ECO ResortTiles (EXP-01-02-A-01/02)
        const addEcoResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = `tile_eco_w${weight}_${i}_${Math.random().toString(36).substr(2, 5)}`;
                G.tiles[id] = { id, type: TileType.Resort, resort: 'ECO', weight, name: `ECO W${weight}` };
                G.zones[CoreZoneNames.DrawPile].items.push(id);
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
        G.zones[CoreZoneNames.DrawPile].items.push(laborMarketId);
        G.zones[laborMarketId] = { id: laborMarketId, name: 'Labor Market', items: [] };

        // 4. Add Investment Program (EXP-01-02-D)
        const ipId = 'tile_investment_program';
        G.tiles[ipId] = { id: ipId, type: TileType.SystemTile, name: 'Investment Program' };
        G.zones[CoreZoneNames.Board].items.push(ipId);
        // Note: System tiles usually sit on board or off board.
        // Investment Program doesn't specify grid coord, works while active.
        // We'll place it on Board zone but maybe not in grid unless needed.

        // 5. Initialize Measures (EXP-01-03)
        MEASURE_IDS.forEach(mId => {
            const objId = `measure_${mId}`;
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
        production: (tileId: string, G: GameState, base: number) => {
            let amount = base;

            // Check if player whose turn produced this is under M09 Investment Freeze
            // Wait, production happens during Round Settlement. M09 says "During the targeted player's current turn".
            // So if a measure effect is already active on a tile, does M09 block it?
            // EXP-01-08-M09-05: "During the targeted player's current turn, ignore Measure effects that modify production output..."
            // But production happens in Settlement, not in a turn.
            // Wait, "During the next round..." (M07), "This round" (M08).
            // M09 says "This turn".
            // Since production is outside turns, M09 probably doesn't affect standard Round Settlement production.

            // M02: Double printed production
            if (G.secret?.doublingEffects?.[tileId]) {
                amount *= 2;
            }

            // M04/M05: Reductions
            if (G.secret?.productionReductions?.[tileId]) {
                amount -= G.secret.productionReductions[tileId];
            }

            return Math.max(0, amount);
        }
    },

    effectHandlers: {
        'TAKE_MEASURE': (G: GameState, ctx: any, effect: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const openZone = G.zones.OpenMeasures;
            const handZone = G.zones[`PlayerHand:${playerId}`];

            if (!openZone || !handZone) return;

            const idx = openZone.items.indexOf(measureObjectId);
            if (idx >= 0) {
                openZone.items.splice(idx, 1);
                handZone.items.push(measureObjectId);
                if (G.objects[measureObjectId]) {
                    G.objects[measureObjectId].owner = playerId;
                }

                // Refill OpenMeasures
                if (G.zones.MeasureDrawPile.items.length > 0) {
                    const next = G.zones.MeasureDrawPile.items.pop();
                    if (next) G.zones.OpenMeasures.items.push(next);
                } else if (G.zones.MeasureRecyclePile.items.length > 0) {
                    // EXP-01-07-05: If DrawPile empty, shuffle RecyclePile
                    G.zones.MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.MeasureRecyclePile.items);
                    G.zones.MeasureRecyclePile.items = [];
                    const next = G.zones.MeasureDrawPile.items.pop();
                    if (next) G.zones.OpenMeasures.items.push(next);
                }
            }
        },
        'PLAY_MEASURE': (G: GameState, ctx: any, effect: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const obj = G.objects[measureObjectId];
            if (!obj || obj.type !== 'Measure') return;

            const mId = obj.measureId;
            if (!mId || !MEASURE_DETAILS[mId]) return;

            const { cost } = MEASURE_DETAILS[mId];

            // 1. Pay Cost (Standard for all measures)
            if (!payResources(G, playerId, cost)) return; // Fails if can't pay

            // 2. Resolve Effect (M01-M10)
            switch (mId) {
                case 'M01': // Budget Compromise
                    if (!G.secret) G.secret = {};
                    if (!G.secret.prohibitedHotspots) G.secret.prohibitedHotspots = [];
                    G.secret.prohibitedHotspots.push(effect.payload.targetTileId);
                    break;
                case 'M02': // Economic Stimulus
                    if (!G.secret.doublingEffects) G.secret.doublingEffects = {};
                    G.secret.doublingEffects[effect.payload.targetTileId] = true;
                    break;
                case 'M03': // Collective Bargaining
                    if (!G.secret.prohibitions) G.secret.prohibitions = {};
                    G.secret.prohibitions.noEcoConvert = true;
                    break;
                case 'M04': // Subsidy Reduction
                    if (!G.secret.productionReductions) G.secret.productionReductions = {};
                    G.secret.productionReductions[effect.payload.targetTileId] = (G.secret.productionReductions[effect.payload.targetTileId] || 0) + 1;
                    break;
                case 'M05': // Location Debate
                    if (!G.secret.productionReductions) G.secret.productionReductions = {};
                    G.secret.productionReductions[effect.payload.targetTileId] = (G.secret.productionReductions[effect.payload.targetTileId] || 0) + 1;
                    break;
                case 'M06': // Budget Deficit
                    if (!G.secret.extraCosts) G.secret.extraCosts = {};
                    G.secret.extraCosts[effect.payload.targetPlayerId] = (G.secret.extraCosts[effect.payload.targetPlayerId] || 0) + 1;
                    break;
                case 'M07': // Debt Brake
                    if (!G.secret.nextRoundProhibitions) G.secret.nextRoundProhibitions = {};
                    G.secret.nextRoundProhibitions.noConvert = true;
                    break;
                case 'M08': // Economic Council
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].ecoSubstitute = true;
                    break;
                case 'M09': // Investment Freeze
                    if (!G.secret.playerProhibitions) G.secret.playerProhibitions = {};
                    G.secret.playerProhibitions[effect.payload.targetPlayerId] = { ignoreMeasureModifiers: true };
                    break;
                case 'M10': // Supplemental Budget (active for this turn)
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].ignoreCostIncrease = true;
                    break;
            }

            // 3. Recycle Measure
            recycleMeasure(G, measureObjectId, playerId);
        },
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
                const infId = `inf_${pid}_labor_${Date.now()}`;
                G.objects[infId] = { id: infId, type: 'Influence', owner: pid };
                const supplyId = `${CoreZoneNames.PersonalSupply}:${pid}`;
                if (G.zones[supplyId]) {
                    G.zones[supplyId].items.push(infId);
                }
            }
        }
    }
};

function payResources(G: GameState, playerId: string, cost: Record<string, number>): boolean {
    const supplyId = `${CoreZoneNames.PersonalSupply}:${playerId}`;
    const supplyZone = G.zones[supplyId];
    const bankZone = G.zones[CoreZoneNames.Bank];
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
        if (!inventory[res] || inventory[res].length < amt) return false;
    }

    for (const [res, amt] of Object.entries(cost)) {
        for (let i = 0; i < amt; i++) {
            const rid = inventory[res].pop()!;
            const idx = supplyZone.items.indexOf(rid);
            supplyZone.items.splice(idx, 1);
            bankZone.items.push(rid);
            if (G.objects[rid]) G.objects[rid].owner = undefined;
        }
    }
    return true;
}

function recycleMeasure(G: GameState, measureObjectId: string, playerId: string) {
    const handId = `PlayerHand:${playerId}`;
    const handZone = G.zones[handId];
    const obj = G.objects[measureObjectId];
    if (!obj || !handZone) return;

    const idx = handZone.items.indexOf(measureObjectId);
    if (idx >= 0) handZone.items.splice(idx, 1);

    obj.playCount = (obj.playCount || 0) + 1;
    obj.owner = undefined;

    if (obj.playCount === 1) {
        G.zones.MeasureRecyclePile.items.push(measureObjectId);
    } else {
        G.zones.MeasureFinalDiscard.items.push(measureObjectId);
    }
}
