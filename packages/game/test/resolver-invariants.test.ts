import { beforeEach, describe, expect, it } from 'vitest';
import { CANONICAL_ENGINE_MODULE_ORDER } from '../src/expansion-registry';
import { EngineModuleRegistry } from '../src/engine/engine-module-registry';
import { EffectResolver } from '../src/engine/resolver';
import { TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeDummyExpansionPack } from './_helpers/dummyPacks';

function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

describe('REF_RESOLVER invariants (tripwires)', () => {
    const Exp02Pack = makeDummyExpansionPack({
        id: 'exp02',
        engine: {
            atoms: [{
                kind: 'regulation.place',
                handler: (G: any, ctx: any, atom: any) => {
                    const { targetTileId } = atom;
                    const supply = G.zones.RegulationSupply;
                    const attached = G.zones.BoardAttached;
                    const item = supply.items.pop();
                    if (item) {
                        attached.items.push(item);
                        G.objects[item].targetTileId = targetTileId;
                    }
                }
            }]
        }
    });

    const Exp03Pack = makeDummyExpansionPack({
        id: 'exp03',
        engine: {
            atoms: [{
                kind: 'countdown.place',
                handler: (G: any, ctx: any, atom: any) => {
                    const { targetTileId, amount } = atom;
                    const supply = G.zones.CountdownSupply;
                    const tileZone = G.zones[targetTileId];
                    const item = supply.items.pop();
                    if (item) {
                        tileZone.items.push(item);
                        G.objects[item].targetTileId = targetTileId;
                        G.objects[item].amount = amount;
                    }
                }
            }]
        }
    });

    beforeEach(() => {
        registerTestPacks([Exp02Pack, Exp03Pack]);
    });

    it('uses the canonical engine module order list exactly', () => {
        expect([...CANONICAL_ENGINE_MODULE_ORDER]).toEqual(['core', 'exp01', 'exp02', 'exp03']);
    });

    it('buildAtomDispatch is deterministic (registration order + atom insertion order do not matter)', () => {
        const mk = (registerInOrder: Array<'core' | 'exp02' | 'exp03'>) => {
            const reg = new EngineModuleRegistry();

            const defs = {
                core: {
                    id: 'core',
                    isEnabled: () => true,
                    atoms: [
                        { kind: 'atom.b', handler: () => {} },
                        { kind: 'atom.a', handler: () => {} },
                    ],
                },
                exp02: {
                    id: 'exp02',
                    isEnabled: () => true,
                    atoms: [
                        { kind: 'atom.d', handler: () => {} },
                        { kind: 'atom.c', handler: () => {} },
                    ],
                },
                exp03: {
                    id: 'exp03',
                    isEnabled: () => true,
                    atoms: [
                        { kind: 'atom.f', handler: () => {} },
                        { kind: 'atom.e', handler: () => {} },
                    ],
                },
            } as const;

            for (const id of registerInOrder) {
                reg.registerModule(defs[id] as any);
            }

            const dispatch = reg.buildAtomDispatch({ meta: { cfg: { expansions: { ex02: true, ex03: true } } } } as any);
            return [...dispatch.keys()];
        };

        expect(mk(['core', 'exp02', 'exp03'])).toEqual(['atom.a', 'atom.b', 'atom.c', 'atom.d', 'atom.e', 'atom.f']);
        expect(mk(['exp03', 'core', 'exp02'])).toEqual(['atom.a', 'atom.b', 'atom.c', 'atom.d', 'atom.e', 'atom.f']);
        expect(mk(['exp02', 'exp03', 'core'])).toEqual(['atom.a', 'atom.b', 'atom.c', 'atom.d', 'atom.e', 'atom.f']);
    });

    it('duplicate kind conflict order follows canonical module order (not registration order)', () => {
        const reg = new EngineModuleRegistry();

        reg.registerModule({
            id: 'core',
            isEnabled: () => true,
            atoms: [
                { kind: 'atom.b', handler: () => {} },
                { kind: 'atom.a', handler: () => {} },
            ],
        });

        reg.registerModule({
            id: 'exp03',
            isEnabled: () => true,
            atoms: [{ kind: 'atom.a', handler: () => {} }],
        });

        reg.registerModule({
            id: 'exp02',
            isEnabled: () => true,
            atoms: [
                { kind: 'atom.b', handler: () => {} },
                { kind: 'atom.a', handler: () => {} },
            ],
        });

        expect(() =>
            reg.buildAtomDispatch({ meta: { cfg: { expansions: { ex02: true, ex03: true } } } } as any)
        ).toThrowError(
            [
                'EngineModuleRegistry: duplicate atom.kind registrations are forbidden.',
                'Conflicts:',
                '- exp02 registers "atom.a" but it is already registered by core',
                '- exp02 registers "atom.b" but it is already registered by core',
                '- exp03 registers "atom.a" but it is already registered by core',
            ].join('\n')
        );
    });

    it('disabled expansions contribute no atom handlers (exp-only atoms become no-ops)', () => {
        const base: any = {
            zones: {
                RegulationSupply: { id: 'RegulationSupply', name: 'RegulationSupply', items: ['reg_m13_1'] },
                BoardAttached: { id: 'BoardAttached', name: 'BoardAttached', items: [] },
                CountdownSupply: { id: 'CountdownSupply', name: 'CountdownSupply', items: ['cd_1'] },
                t1: { id: 't1', name: 't1', items: [] },
            },
            tiles: { t1: { id: 't1', type: TileType.Resort, resort: 'DOM', weight: 1 } },
            objects: {
                reg_m13_1: { id: 'reg_m13_1', type: 'Regulation', regType: 'M13' },
                cd_1: { id: 'cd_1', type: 'Countdown' },
            },
            adjacency: {},
            grid: {},
            engine: { idSeq: 0, effectQueue: [], activeModifiers: [], history: [], attributes: {} },
        };

        const disabled = cloneJson({
            ...base,
            meta: { cfg: { expansions: { ex01: false, ex02: false, ex03: false } } },
            engine: {
                ...base.engine,
                effectQueue: [
                    { kind: 'regulation.place', regType: 'M13', targetTileId: 't1' },
                    { kind: 'countdown.place', targetTileId: 't1', amount: 3 },
                ],
            },
        });

        const enabled = cloneJson({
            ...base,
            meta: { cfg: { expansions: { ex01: false, ex02: true, ex03: true } } },
            engine: cloneJson(disabled.engine),
        });

        expect(EffectResolver.resolve(disabled, {})).toBe(true);
        expect(disabled.zones.RegulationSupply.items).toEqual(['reg_m13_1']);
        expect(disabled.zones.BoardAttached.items).toEqual([]);
        expect(disabled.zones.CountdownSupply.items).toEqual(['cd_1']);
        expect(disabled.zones.t1.items).toEqual([]);

        expect(EffectResolver.resolve(enabled, {})).toBe(true);
        expect(enabled.zones.RegulationSupply.items).toEqual([]);
        expect(enabled.zones.BoardAttached.items).toEqual(['reg_m13_1']);
        expect(enabled.objects.reg_m13_1.targetTileId).toBe('t1');
        expect(enabled.zones.CountdownSupply.items).toEqual([]);
        expect(enabled.zones.t1.items).toEqual(['cd_1']);
        expect(enabled.objects.cd_1.targetTileId).toBe('t1');
        expect(enabled.objects.cd_1.amount).toBe(3);
    });

    it('effect queue resolution is stable across identical runs (where feasible)', () => {
        const base: any = {
            zones: {
                t1: { id: 't1', name: 't1', items: ['inf_on_tile'] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['inf_supply'] },
            },
            tiles: { t1: { id: 't1', type: TileType.Resort, resort: 'DOM', weight: 1 } },
            objects: {
                inf_on_tile: { id: 'inf_on_tile', type: 'Influence', owner: 'p1' },
                inf_supply: { id: 'inf_supply', type: 'Influence', owner: 'p1' },
            },
            adjacency: { t1: [] },
            grid: {},
            meta: { cfg: { expansions: { ex01: false, ex02: false, ex03: false } } },
            engine: {
                idSeq: 0,
                effectQueue: [{ kind: 'hotspot.resolve', tileId: 't1' }],
                activeModifiers: [
                    {
                        id: 'm1',
                        sourceId: 'src',
                        hook: 'beforeAction',
                        effect: { kind: 'rule.attribute', attribute: 'tripwire', value: 'before', context: { append: true } },
                        expiry: 'thisTurn',
                        priority: 1,
                    },
                ],
                history: [],
                attributes: {},
            },
        };

        const a = cloneJson(base);
        const b = cloneJson(base);

        expect(EffectResolver.resolve(a, {})).toBe(true);
        expect(EffectResolver.resolve(b, {})).toBe(true);

        expect(a.engine.history).toEqual(b.engine.history);
        expect(a.engine.attributes).toEqual(b.engine.attributes);
        expect(a.zones).toEqual(b.zones);
        expect(a.objects).toEqual(b.objects);
    });
});
