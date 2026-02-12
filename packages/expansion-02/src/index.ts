import { ExpansionDefinition, GameState, ResourceType, TileType, CoreResources, CoreZoneNames, GameObject, RegulationType } from '@balance-control/rules';

const EXP_02_NAME = 'EXP-02 Security & Order';

const MEASURE_IDS = [
    'M01', 'M02', 'M03', 'M04', 'M05',
    'M06', 'M07', 'M08', 'M09', 'M10',
    'M11', 'M12', 'M13', 'M14', 'M15'
];

const MEASURE_DETAILS: Record<string, { name: string, cost: Record<string, number> }> = {
    'M01': { name: 'Threat Situation', cost: { SEC: 1, INF: 1 } },
    'M02': { name: 'Emergency Decree', cost: { SEC: 2 } },
    'M03': { name: 'Deployment Order', cost: { SEC: 1 } },
    'M04': { name: 'Jurisdiction Shift', cost: { SEC: 1 } },
    'M05': { name: 'Competence Conflict', cost: { SEC: 1, DOM: 1 } },
    'M06': { name: 'Order Partnership', cost: { SEC: 1, FOR: 1 } },
    'M07': { name: 'Legal Review', cost: { SEC: 1, DOM: 1 } },
    'M08': { name: 'De-escalation', cost: { SEC: 1, INF: 1 } },
    'M09': { name: 'Parliamentary Oversight', cost: { DOM: 1, SEC: 1 } },
    'M10': { name: 'State of Exception', cost: { SEC: 2, DOM: 1 } },
    'M11': { name: 'Risk Address', cost: { SEC: 1 } },
    'M12': { name: 'Loss of Control', cost: { SEC: 2 } },
    'M13': { name: 'Surveillance', cost: { SEC: 1, INF: 1 } },
    'M14': { name: 'File Status', cost: { SEC: 1, DOM: 1 } },
    'M15': { name: 'Situation Assessment', cost: { SEC: 1 } },
};

export const Expansion02: ExpansionDefinition = {
    name: EXP_02_NAME,
    resources: ['SEC'],
    zones: [
        'RegulationSupply',
        'BoardAttached',
        'EXP02_MeasureDrawPile',
        'EXP02_OpenMeasures',
        'EXP02_MeasureRecyclePile',
        'EXP02_MeasureFinalDiscard'
    ],

    onSetup: (G: GameState, ctx: any) => {
        // 1. Initialize Zones
        G.zones.RegulationSupply = { id: 'RegulationSupply', name: 'Regulation Supply', items: [] };
        G.zones.BoardAttached = { id: 'BoardAttached', name: 'Board Attached Regulations', items: [] };
        G.zones.EXP02_MeasureDrawPile = { id: 'EXP02_MeasureDrawPile', name: 'EXP-02 Measure Draw Pile', items: [] };
        G.zones.EXP02_MeasureRecyclePile = { id: 'EXP02_MeasureRecyclePile', name: 'EXP-02 Measure Recycle Pile', items: [] };
        G.zones.EXP02_MeasureFinalDiscard = { id: 'EXP02_MeasureFinalDiscard', name: 'EXP-02 Measure Final Discard', items: [] };
        G.zones.EXP02_OpenMeasures = { id: 'EXP02_OpenMeasures', name: 'EXP-02 Open Measures', items: [] };

        // 2. Add SEC ResortTiles (Assuming similar scaling to ECO for now as per usual patterns)
        const addSecResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = `tile_sec_w${weight}_${i}_${Math.random().toString(36).substr(2, 5)}`;
                G.tiles[id] = { id, type: TileType.Resort, resort: 'SEC', weight, name: `SEC W${weight}` };
                G.zones[CoreZoneNames.DrawPile].items.push(id);
                G.zones[id] = { id, name: `SEC W${weight}`, items: [] };
            }
        };
        // 2-4 players (W1x2, W2x1, W3x1)
        addSecResort(1, 2); addSecResort(2, 1); addSecResort(3, 1);
        if (ctx.numPlayers >= 5) {
            addSecResort(1, 1); addSecResort(2, 1); addSecResort(3, 1);
        }

        // 3. Add Inner Order Hotspot
        const innerOrderId = 'tile_inner_order';
        G.tiles[innerOrderId] = { id: innerOrderId, type: TileType.Hotspot, name: 'Inner Order', isHotspot: true };
        G.zones[CoreZoneNames.DrawPile].items.push(innerOrderId);
        G.zones[innerOrderId] = { id: innerOrderId, name: 'Inner Order', items: [] };

        // 4. Add Authority Apparatus
        const authorityId = 'tile_authority_apparatus';
        G.tiles[authorityId] = { id: authorityId, type: TileType.SystemTile, name: 'Authority Apparatus' };
        G.zones[CoreZoneNames.Board].items.push(authorityId);

        // 5. Initialize Measures
        MEASURE_IDS.forEach(mId => {
            const objId = `exp02_measure_${mId}`;
            G.objects[objId] = { id: objId, type: 'Measure', measureId: mId, playCount: 0 };
            G.zones.EXP02_MeasureDrawPile.items.push(objId);
        });

        // 6. Initialize Regulation Objects (Unlimited supply means we create on demand or pre-create some)
        // We'll pre-create a pool for simplicity in zone tracking, or just create on the fly.
        // Spec says "There is no limit to the number of Regulations in RegulationSupply."
        // We'll create 10 of each as a starting pool.
        ['SecurityLevel', 'Control', 'Administration', 'Blockade'].forEach((type, tIdx) => {
            for (let i = 0; i < 10; i++) {
                const id = `reg_${type}_${i}`;
                G.objects[id] = { id, type: 'Regulation', regType: type as RegulationType };
                G.zones.RegulationSupply.items.push(id);
            }
        });

        // 7. Shuffle and deal 3 Measures
        G.zones.EXP02_MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.EXP02_MeasureDrawPile.items);
        for (let i = 0; i < 3; i++) {
            const mId = G.zones.EXP02_MeasureDrawPile.items.pop();
            if (mId) G.zones.EXP02_OpenMeasures.items.push(mId);
        }

        console.log('EXP-02 Setup Complete.');
    },

    getMeasureAtoms: (G: GameState, measureId: string, payload: any): any[] | null => {
        switch (measureId) {
            case 'M01': // Threat Situation
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
                    { kind: 'regulation.place', regType: payload.regType, targetTileId: payload.targetTileId }
                ];
            case 'M02': // Emergency Decree
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC'] },
                    { kind: 'regulation.place', regType: 'Blockade', targetTileId: payload.targetTileId }
                ];
            case 'M03':
            case 'M04': // Jurisdiction Shift / Deployment Order
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
                    { kind: 'regulation.move', regulationId: payload.regulationId, targetTileId: payload.newTargetTileId }
                ];
            case 'M05': // Competence Conflict
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M05_${Date.now()}`,
                            sourceId: 'M05',
                            hook: 'beforeAction',
                            targetTileId: 'tile_authority_apparatus',
                            effect: { kind: 'regulation.place', regType: 'Administration', targetTileId: 'tile_authority_apparatus' },
                            expiry: 'thisRound'
                        }
                    }
                ];
            case 'M06': // Order Partnership
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'FOR'] },
                    { kind: 'rule.attribute', attribute: 'secSubstitution', value: true, playerId: payload.playerId }
                ];
            case 'M08': // De-escalation
                const regsOnTile = G.zones.BoardAttached.items.filter(id => G.objects[id].targetTileId === payload.targetTileId);
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
                    ...regsOnTile.map(rid => ({ kind: 'regulation.remove' as const, regulationId: rid }))
                ];
            case 'M09': // Parliamentary Oversight
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M09_${Date.now()}`,
                            sourceId: 'M09',
                            hook: 'beforeAction', // Trigger on reg placement
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['ANY'] },
                            expiry: 'thisRound'
                        }
                    }
                ];
            case 'M10': // State of Exception
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 3, resorts: ['SEC', 'DOM'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M10_${Date.now()}`,
                            sourceId: 'M10',
                            hook: 'beforeAction',
                            priority: 10,
                            effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['ANY'] },
                            expiry: 'thisTurn'
                        }
                    }
                ];
            case 'M11': // Risk Address
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
                    {
                        kind: 'modifier.add',
                        modifier: {
                            id: `M11_${payload.targetPlayerId}_${Date.now()}`,
                            sourceId: 'M11',
                            hook: 'beforeAction',
                            playerId: payload.targetPlayerId,
                            effect: { kind: 'rule.prohibit', actionType: 'measure.play' },
                            expiry: 'nextRound'
                        }
                    }
                ];
            case 'M12': // Loss of Control
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC'] },
                    { kind: 'regulation.place', regType: payload.regType, targetTileId: payload.targetTileId }
                ];
            case 'M13': // Surveillance
                const currentProtected = G.engine.attributes.protectedTiles || [];
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
                    { kind: 'rule.attribute', attribute: 'protectedTiles', value: [...currentProtected, payload.targetTileId] }
                ];
            case 'M14': // File Status
                const currentDoubled = G.engine.attributes.doubledRegs || [];
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
                    { kind: 'rule.attribute', attribute: 'doubledRegs', value: [...currentDoubled, payload.regulationId] }
                ];
            case 'M15': // Situation Assessment
                return [
                    { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
                    { kind: 'rule.attribute', attribute: 'regDiscount', value: 1, playerId: payload.playerId }
                ];
        }
        return null;
    },

    effectHandlers: {
        'TAKE_MEASURE_EXP02': (G: GameState, ctx: any, effect: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const openZone = G.zones.EXP02_OpenMeasures;
            const handZone = G.zones[`PlayerHand:${playerId}`];
            const idx = openZone.items.indexOf(measureObjectId);
            if (idx >= 0) {
                openZone.items.splice(idx, 1);
                handZone.items.push(measureObjectId);
                G.objects[measureObjectId].owner = playerId;
                // Refill
                if (G.zones.EXP02_MeasureDrawPile.items.length > 0) {
                    const next = G.zones.EXP02_MeasureDrawPile.items.pop();
                    if (next) G.zones.EXP02_OpenMeasures.items.push(next);
                } else if (G.zones.EXP02_MeasureRecyclePile.items.length > 0) {
                    G.zones.EXP02_MeasureDrawPile.items = (ctx as any).random.Shuffle(G.zones.EXP02_MeasureRecyclePile.items);
                    G.zones.EXP02_MeasureRecyclePile.items = [];
                    const next = G.zones.EXP02_MeasureDrawPile.items.pop();
                    if (next) G.zones.EXP02_OpenMeasures.items.push(next);
                }
            }
        },
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            if (effect.payload.tileId === 'tile_innere_ordnung') {
                const result = utils?.computeMajority?.(effect.payload.tileId, G);
                if (result?.controller) {
                    const pid = result.controller;
                    if (effect.payload.action === 'place') {
                        let cost = 2;
                        if (G.engine.attributes.regDiscount?.[pid]) {
                            cost = Math.max(1, cost - G.engine.attributes.regDiscount[pid]);
                            // We don't decrement here, we let the pay atom or a separate attribute atom handle it?
                            // Actually, regDiscount is usually per-action.
                        }
                        G.engine.effectQueue.push(
                            { kind: 'resource.pay', playerId: pid, amount: cost, resorts: ['SEC'] },
                            { kind: 'regulation.place', regType: effect.payload.regType, targetTileId: effect.payload.targetTileId }
                        );
                    } else if (effect.payload.action === 'move') {
                        G.engine.effectQueue.push({
                            kind: 'regulation.move',
                            regulationId: effect.payload.regulationId,
                            targetTileId: effect.payload.targetTileId
                        });
                    }
                }
            }
        },
        'SYSTEM_TILE': (G: GameState, ctx: any, effect: any) => {
            if (effect.payload.tileId === 'tile_authority_apparatus') {
                const pid = effect.payload.playerId;
                if (effect.payload.action === 'move') {
                    G.engine.effectQueue.push({
                        kind: 'regulation.move',
                        regulationId: effect.payload.regulationId,
                        targetTileId: effect.payload.targetTileId
                    });
                } else if (effect.payload.action === 'remove') {
                    G.engine.effectQueue.push({
                        kind: 'regulation.remove',
                        regulationId: effect.payload.regulationId
                    });
                }

                if (G.engine.attributes.administrationOnAuthority) {
                    G.engine.effectQueue.push({
                        kind: 'regulation.place',
                        regType: 'Administration',
                        targetTileId: 'tile_authority_apparatus'
                    });
                }
            }
        }
    }
};
