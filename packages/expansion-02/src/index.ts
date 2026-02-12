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
        'PLAY_MEASURE_EXP02': (G: GameState, ctx: any, effect: any, utils: any) => {
            const { playerId, measureObjectId } = effect.payload;
            const obj = G.objects[measureObjectId];
            if (!obj || obj.type !== 'Measure') return;
            const mId = obj.measureId!;
            const { cost } = MEASURE_DETAILS[mId];

            // 1. Pay Cost
            if (!payResources(G, playerId, cost)) return;

            // 2. Resolve Effects
            switch (mId) {
                case 'M01': // Threat Situation: Place one Regulation of choice
                    placeRegulation(G, effect.payload.regType, effect.payload.targetTileId, true); // Override cost
                    break;
                case 'M02': // Emergency Decree: Place Blockade on Hotspot
                    placeRegulation(G, 'Blockade', effect.payload.targetTileId, true);
                    break;
                case 'M03': // Deployment Order: After placing, move it
                    // This is logic that might need state tracking or immediate resolution
                    // We'll move the last placed regulation? The spec says "After placing a Regulation, move that Regulation"
                    // We'll assume the payload contains the regulationId to move
                    moveRegulation(G, effect.payload.regulationId, effect.payload.newTargetTileId);
                    break;
                case 'M04': // Jurisdiction Shift: Move one existing Regulation
                    moveRegulation(G, effect.payload.regulationId, effect.payload.newTargetTileId);
                    break;
                case 'M05': // Competence Conflict: Administration on Authority Apparatus activation
                    // This is a triggered effect. We'll set a flag.
                    if (!G.secret.exp02) G.secret.exp02 = {};
                    G.secret.exp02.administrationOnAuthority = true;
                    break;
                case 'M06': // Order Partnership: SEC substitutes any one resource for Reg/Measure costs
                    if (!G.secret.exp02) G.secret.exp02 = {};
                    G.secret.exp02.secSubstitution = true;
                    break;
                case 'M07': // Legal Review: Remove one Regulation
                    removeRegulation(G, effect.payload.regulationId);
                    break;
                case 'M08': // De-escalation: Remove all Regulations from one Hotspot
                    removeAllRegulations(G, effect.payload.targetTileId);
                    break;
                case 'M09': // Parliamentary Oversight: Each Regulation adds +1 cost.
                    if (!G.secret.exp02) G.secret.exp02 = {};
                    G.secret.exp02.extraRegCost = (G.secret.exp02.extraRegCost || 0) + 1;
                    break;
                case 'M10': // State of Exception: All effects cost +1
                    if (!G.secret.extraCosts) G.secret.extraCosts = {};
                    Object.keys(G.zones).filter(z => z.startsWith('PersonalSupply')).forEach(z => {
                        const pid = z.split(':')[1];
                        G.secret.extraCosts[pid] = (G.secret.extraCosts[pid] || 0) + 1;
                    });
                    break;
                case 'M11': // Risk Address: Target player may not PlayMeasure next round
                    if (!G.secret.nextRoundProhibitions) G.secret.nextRoundProhibitions = {};
                    G.secret.nextRoundProhibitions[effect.payload.targetPlayerId] = { noPlayMeasure: true };
                    break;
                case 'M12': // Loss of Control: Place Regulation on Hotspot (pay cost)
                    // payload: regType, targetTileId
                    // This one REQUIRES paying the 2 SEC cost (EXP-02-08-M12-03)
                    if (payResources(G, playerId, { SEC: 2 })) {
                        placeRegulation(G, effect.payload.regType, effect.payload.targetTileId, true);
                    }
                    break;
                case 'M13': // Surveillance: Regulations on chosen Tile may not be moved or removed
                    if (!G.secret.exp02) G.secret.exp02 = {};
                    if (!G.secret.exp02.protectedTiles) G.secret.exp02.protectedTiles = [];
                    G.secret.exp02.protectedTiles.push(effect.payload.targetTileId);
                    break;
                case 'M14': // File Status: One Regulation counts twice
                    if (!G.secret.exp02) G.secret.exp02 = {};
                    if (!G.secret.exp02.doubledRegs) G.secret.exp02.doubledRegs = [];
                    G.secret.exp02.doubledRegs.push(effect.payload.regulationId);
                    break;
                case 'M15': // Situation Assessment: Reduce cost of next Regulation placement by 1 SEC
                    if (!G.secret.playerPerks) G.secret.playerPerks = {};
                    if (!G.secret.playerPerks[playerId]) G.secret.playerPerks[playerId] = {};
                    G.secret.playerPerks[playerId].regDiscount = (G.secret.playerPerks[playerId].regDiscount || 0) + 1;
                    break;
            }

            // 3. Recycle
            recycleMeasureEXP02(G, measureObjectId, playerId);
        },
        'HOTSPOT_RESOLUTION': (G: GameState, ctx: any, effect: any, utils: any) => {
            if (effect.payload.tileId === 'tile_inner_order') {
                const result = utils?.computeMajority?.(effect.payload.tileId, G);
                if (result?.controller) {
                    const pid = result.controller;
                    // Logic for "Inner Order": Place or Move
                    // This would likely be a stage or a payload-driven resolution
                    if (effect.payload.action === 'place') {
                        // Normally costs 2 SEC
                        let cost = 2;
                        if (G.secret.playerPerks?.[pid]?.regDiscount) {
                            cost = Math.max(1, cost - G.secret.playerPerks[pid].regDiscount);
                            G.secret.playerPerks[pid].regDiscount--;
                        }
                        if (payResources(G, pid, { SEC: cost })) {
                            placeRegulation(G, effect.payload.regType, effect.payload.targetTileId, true);
                        }
                    } else if (effect.payload.action === 'move') {
                        moveRegulation(G, effect.payload.regulationId, effect.payload.targetTileId);
                    }
                }
            }
        },
        'SYSTEM_TILE': (G: GameState, ctx: any, effect: any) => {
            if (effect.payload.tileId === 'tile_authority_apparatus') {
                const pid = effect.payload.playerId;
                // Move or Remove (no SEC cost)
                if (effect.payload.action === 'move') {
                    moveRegulation(G, effect.payload.regulationId, effect.payload.targetTileId);
                } else if (effect.payload.action === 'remove') {
                    removeRegulation(G, effect.payload.regulationId);
                }

                // M05 logic
                if (G.secret.exp02?.administrationOnAuthority) {
                    placeRegulation(G, 'Administration', 'tile_authority_apparatus', true);
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

    // Handle M06 substitution if applicable
    let subAvailable = G.secret?.exp02?.secSubstitution ? 1 : 0;

    for (const [res, amt] of Object.entries(cost)) {
        let needed = amt;
        const available = inventory[res]?.length || 0;

        if (available < needed) {
            const diff = needed - available;
            if (res !== 'SEC' && subAvailable >= diff && inventory['SEC']?.length >= diff) {
                needed = available;
                // We'll deduct them below
            } else {
                return false;
            }
        }
    }

    // Actually deduct
    for (const [res, amt] of Object.entries(cost)) {
        let needed = amt;
        let diff = 0;
        if (inventory[res]?.length < needed) {
            diff = needed - inventory[res].length;
            needed = inventory[res].length;
        }

        // Deduct specific resort
        for (let i = 0; i < needed; i++) {
            const rid = inventory[res].pop()!;
            supplyZone.items.splice(supplyZone.items.indexOf(rid), 1);
            bankZone.items.push(rid);
            G.objects[rid].owner = undefined;
        }

        // Deduct SEC as sub
        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                const rid = inventory['SEC'].pop()!;
                supplyZone.items.splice(supplyZone.items.indexOf(rid), 1);
                bankZone.items.push(rid);
                G.objects[rid].owner = undefined;
                subAvailable--;
            }
        }
    }
    return true;
}

function placeRegulation(G: GameState, type: RegulationType, targetTileId: string, costPaid: boolean = false) {
    const supply = G.zones.RegulationSupply;
    const attached = G.zones.BoardAttached;
    const regId = supply.items.find(id => G.objects[id].regType === type);

    if (regId) {
        supply.items.splice(supply.items.indexOf(regId), 1);
        attached.items.push(regId);
        G.objects[regId].targetTileId = targetTileId;
    } else {
        // Create new if supply empty (unlimited)
        const newId = `reg_${type}_gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        G.objects[newId] = { id: newId, type: 'Regulation', regType: type, targetTileId };
        attached.items.push(newId);
    }
}

function moveRegulation(G: GameState, regulationId: string, newTargetTileId: string) {
    const obj = G.objects[regulationId];
    if (!obj || obj.type !== 'Regulation') return;

    // Check M13 protection
    if (G.secret?.exp02?.protectedTiles?.includes(obj.targetTileId)) return;

    obj.targetTileId = newTargetTileId;
}

function removeRegulation(G: GameState, regulationId: string) {
    const obj = G.objects[regulationId];
    if (!obj || obj.type !== 'Regulation') return;

    // Check M13 protection
    if (G.secret?.exp02?.protectedTiles?.includes(obj.targetTileId)) return;

    const attached = G.zones.BoardAttached;
    const supply = G.zones.RegulationSupply;

    attached.items.splice(attached.items.indexOf(regulationId), 1);
    supply.items.push(regulationId);
    obj.targetTileId = undefined;
}

function removeAllRegulations(G: GameState, targetTileId: string) {
    const attached = G.zones.BoardAttached;
    const toRemove = attached.items.filter(rid => G.objects[rid].targetTileId === targetTileId);
    toRemove.forEach(rid => removeRegulation(G, rid));
}

function recycleMeasureEXP02(G: GameState, measureObjectId: string, playerId: string) {
    const obj = G.objects[measureObjectId];
    const handId = `PlayerHand:${playerId}`;
    const handZone = G.zones[handId];

    if (handZone.items.includes(measureObjectId)) {
        handZone.items.splice(handZone.items.indexOf(measureObjectId), 1);
    }

    obj.playCount = (obj.playCount || 0) + 1;
    obj.owner = undefined;

    if (obj.playCount === 1) {
        G.zones.EXP02_MeasureRecyclePile.items.push(measureObjectId);
    } else {
        G.zones.EXP02_MeasureFinalDiscard.items.push(measureObjectId);
    }
}
