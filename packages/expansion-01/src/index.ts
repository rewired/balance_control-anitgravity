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
        // Porting to engine atoms soon...
    },

    getMeasureAtoms(G: GameState, measureId: string, payload: any): any[] | null {
        switch (measureId) {
            case 'M01': // Budget Compromise
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 3, resorts: ['DOM', 'ECO', 'INF'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M01_${payload.targetTileId}_${Date.now()}`,
                            sourceId: 'M01',
                            hook: 'onSettlement', // Or a new hook for hotspots
                            effect: { kind: 'hotspot.prohibit', tileId: payload.targetTileId, window: 'thisTurn' },
                            expiry: 'thisTurn',
                            targetTileId: payload.targetTileId
                        }
                    }
                ];
            case 'M02': // Economic Stimulus
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M02'].cost.ECO, resorts: ['ECO', 'FOR'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M02_${payload.targetTileId}_${Date.now()}`,
                            sourceId: 'M02',
                            hook: 'onProduction',
                            priority: 100, // Doubling runs early
                            effect: {
                                kind: 'resource.grant',
                                playerId: 'CONTROLLER',
                                amount: 'CONTEXT_BASE',
                                resort: 'CONTEXT_RESORT',
                                context: { tileId: payload.targetTileId }
                            },
                            expiry: 'thisRound',
                            targetTileId: payload.targetTileId
                        }
                    }
                ];
            case 'M03': // Collective Bargaining
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M03'].cost.ECO, resorts: ['ECO'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M03_${Date.now()}`,
                            sourceId: 'M03',
                            hook: 'beforeAction',
                            effect: { kind: 'rule.prohibit', actionType: 'CONVERT', targetResort: 'ECO' },
                            expiry: 'thisRound'
                        }
                    }
                ];
            case 'M04': // Subsidy Reduction
            case 'M05': // Location Debate
                const costM04 = MEASURE_DETAILS['M04'].cost;
                const costM05 = MEASURE_DETAILS['M05'].cost;
                const costResorts = measureId === 'M04' ? ['ECO', 'DOM'] : ['ECO', 'INF'];
                const costAmount = measureId === 'M04' ? costM04.ECO + (costM04.DOM || 0) : costM05.ECO + (costM05.INF || 0);
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: costAmount, resorts: costResorts },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `${measureId}_${payload.targetTileId}_${Date.now()}`,
                            sourceId: measureId,
                            hook: 'onProduction',
                            priority: 10, // Reductions run after doubling
                            effect: {
                                kind: 'resource.grant',
                                playerId: 'CONTROLLER',
                                amount: -1,
                                resort: 'CONTEXT_RESORT',
                                context: { tileId: payload.targetTileId }
                            },
                            expiry: 'thisRound',
                            targetTileId: payload.targetTileId
                        }
                    }
                ];
            case 'M06': // Budget Deficit
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M06'].cost.ECO, resorts: ['ECO'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M06_${payload.targetPlayerId}_${Date.now()}`,
                            sourceId: 'M06',
                            hook: 'beforeAction',
                            priority: 10,
                            playerId: payload.targetPlayerId,
                            effect: { kind: 'resource.pay', playerId: payload.targetPlayerId, amount: 1, resorts: ['ANY'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
            case 'M07': // Debt Brake
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M07'].cost.ECO, resorts: ['DOM', 'ECO'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M07_${Date.now()}`,
                            sourceId: 'M07',
                            hook: 'beforeAction',
                            effect: { kind: 'rule.prohibit', actionType: 'CONVERT' },
                            expiry: 'nextRound'
                        }
                    }
                ];
            case 'M08': // Economic Council
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M08'].cost.ECO, resorts: ['ECO'] },
                    { kind: 'rule.attribute', attribute: 'ecoSubstitute', value: true, playerId: payload.playerId }
                ];
            case 'M09': // Investment Freeze
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M09'].cost.ECO, resorts: ['ECO', 'INF'] },
                    { kind: 'rule.attribute', attribute: 'ignoreMeasureModifiers', value: true, playerId: payload.targetPlayerId }
                ];
            case 'M10': // Supplemental Budget
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: MEASURE_DETAILS['M10'].cost.ECO, resorts: ['ECO'] },
                    { kind: 'rule.attribute', attribute: 'ignoreCostIncrease', value: true, playerId: payload.playerId }
                ];
        }
        return null;
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
