import { ExpansionDefinition, GameState, TileType, GameObject, RegulationType } from '@balance-control/rules';

const CoreZoneNames = {
    PersonalSupply: 'PersonalSupply',
    DrawPile: 'DrawPile',
    Board: 'Board'
} as const;

const EXP_02_NAME = 'EXP-02 Security & Order';
export const EXP02_TILE_INNER_ORDER_ID = 'tile_inner_order' as const;

export const MEASURE_IDS = [
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

export const MEASURE_ATOM_BUILDERS: Record<string, (G: GameState, payload: any) => any[] | null> = {
    'M01': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
        { kind: 'regulation.place', regType: payload.regType, targetTileId: payload.targetTileId }
    ],
    'M02': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC'] },
        { kind: 'regulation.place', regType: 'Blockade', targetTileId: payload.targetTileId }
    ],
    'M03': (G, payload) => buildM03M04(G, payload),
    'M04': (G, payload) => buildM03M04(G, payload),
    'M05': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, 'M05'),
                sourceId: 'M05',
                hook: 'beforeAction',
                targetTileId: 'tile_authority_apparatus',
                effect: { kind: 'regulation.place', regType: 'Administration', targetTileId: 'tile_authority_apparatus' },
                expiry: 'thisRound'
            }
        }
    ],
    'M06': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'FOR'] },
        { kind: 'rule.attribute', attribute: 'secSubstitution', value: true, playerId: payload.playerId }
    ],
    'M07': () => null, // Intentionally not implemented in original switch
    'M08': (G, payload) => {
        const regsOnTile = G.zones.BoardAttached.items.filter(id => G.objects[id].targetTileId === payload.targetTileId);
        return [
            { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
            ...regsOnTile.map(rid => ({ kind: 'regulation.remove' as const, regulationId: rid }))
        ];
    },
    'M09': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, 'M09'),
                sourceId: 'M09',
                hook: 'beforeAction', // Trigger on reg placement
                effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['ANY'] },
                expiry: 'thisRound'
            }
        }
    ],
    'M10': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 3, resorts: ['SEC', 'DOM'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, 'M10'),
                sourceId: 'M10',
                hook: 'beforeAction',
                priority: 10,
                effect: { kind: 'resource.pay', playerId: 'CONTEXT_PLAYER' as any, amount: 1, resorts: ['ANY'] },
                expiry: 'thisTurn'
            }
        }
    ],
    'M11': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
        {
            kind: 'modifier.add',
            modifier: {
                id: allocId(G, `M11_${payload.targetPlayerId}`),
                sourceId: 'M11',
                hook: 'beforeAction',
                playerId: payload.targetPlayerId,
                effect: { kind: 'rule.prohibit', actionType: 'measure.play' },
                expiry: 'nextRound'
            }
        }
    ],
    'M12': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC'] },
        { kind: 'regulation.place', regType: payload.regType, targetTileId: payload.targetTileId }
    ],
    'M13': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'INF'] },
        { kind: 'rule.attribute', attribute: 'protectedTiles', value: payload.targetTileId, context: { append: true } }
    ],
    'M14': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 2, resorts: ['SEC', 'DOM'] },
        { kind: 'rule.attribute', attribute: 'doubledRegs', value: payload.regulationId, context: { append: true } }
    ],
    'M15': (G, payload) => [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
        { kind: 'rule.attribute', attribute: `regDiscount:${payload.playerId}`, value: 1 }
    ],
};

function buildM03M04(G: GameState, payload: any): any[] | null {
    return [
        { kind: 'resource.pay', playerId: payload.playerId, amount: 1, resorts: ['SEC'] },
        { kind: 'regulation.move', regulationId: payload.regulationId, targetTileId: payload.newTargetTileId }
    ];
}

export const Expansion02: ExpansionDefinition = {
    id: 'exp02',
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
    measureDecks: [
        {
            id: 'measures',
            objectIdPrefix: 'exp02_measure_',
            zones: {
                drawPileId: 'EXP02_MeasureDrawPile',
                openZoneId: 'EXP02_OpenMeasures',
                recyclePileId: 'EXP02_MeasureRecyclePile',
                finalDiscardId: 'EXP02_MeasureFinalDiscard'
            }
        }
    ],

    onSetup: (G: GameState, ctx: any) => {
        // 1. Initialize Zones
        G.zones.RegulationSupply = { id: 'RegulationSupply', name: 'Regulation Supply', items: [] };
        G.zones.BoardAttached = { id: 'BoardAttached', name: 'Board Attached Regulations', items: [] };
        G.zones.EXP02_MeasureDrawPile = { id: 'EXP02_MeasureDrawPile', name: 'EXP-02 Measure Draw Pile', items: [] };
        G.zones.EXP02_MeasureRecyclePile = { id: 'EXP02_MeasureRecyclePile', name: 'EXP-02 Measure Recycle Pile', items: [] };
        G.zones.EXP02_MeasureFinalDiscard = { id: 'EXP02_MeasureFinalDiscard', name: 'EXP-02 Measure Final Discard', items: [] };
        G.zones.EXP02_OpenMeasures = { id: 'EXP02_OpenMeasures', name: 'EXP-02 Open Measures', items: [] };

        const playerIds = Object.keys(G.zones)
            .filter(z => z.startsWith(CoreZoneNames.PersonalSupply))
            .map(z => z.split(':')[1]);

        playerIds.forEach(pid => {
            const handId = `PlayerHand:${pid}`;
            G.zones[handId] = { id: handId, name: 'Hand', items: [] };
        });

        // 2. Add SEC ResortTiles (Assuming similar scaling to ECO for now as per usual patterns)
        const addSecResort = (weight: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const id = allocId(G, `tile_sec_w${weight}_${i}`);
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
        G.tiles[EXP02_TILE_INNER_ORDER_ID] = { id: EXP02_TILE_INNER_ORDER_ID, type: TileType.Hotspot, name: 'Inner Order', isHotspot: true };
        G.zones[CoreZoneNames.DrawPile].items.push(EXP02_TILE_INNER_ORDER_ID);
        G.zones[EXP02_TILE_INNER_ORDER_ID] = { id: EXP02_TILE_INNER_ORDER_ID, name: 'Inner Order', items: [] };

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
        const builder = MEASURE_ATOM_BUILDERS[measureId];
        return builder ? builder(G, payload) : null;
    },

    effectHandlers: {
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            if (effect.payload.tileId === EXP02_TILE_INNER_ORDER_ID) {
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

function allocId(G: GameState, prefix: string): string {
    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}
