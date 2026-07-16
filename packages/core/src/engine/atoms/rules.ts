import { type AtomRegistration, removeModifier } from '@balance-control/game';

function handleRuleAttribute(G: any, atom: any): void {
    const { attribute, value, playerId, targetTileId, context } = atom;
    const key = playerId ? `${attribute}:${playerId}` : (targetTileId ? `${attribute}:${targetTileId}` : attribute);

    if (context?.append) {
        if (!G.engine.attributes[key]) G.engine.attributes[key] = [];
        if (Array.isArray(G.engine.attributes[key])) {
            G.engine.attributes[key].push(value);
        }
    } else {
        G.engine.attributes[key] = value;
    }
}

function handleRuleProhibit(G: any, _atom: any): void {
    G.engine.effectQueue = []; // Full stop
}

type TriggerHook = (G: any, ctx: any, hook: any, payload?: any) => void;

/**
 * Creates the core rule atoms.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function createCoreRulesAtoms(opts: { triggerHook: TriggerHook }): AtomRegistration[] {
    return [
        {
            kind: 'modifier.add',
            handler: (G2, _ctx, atom) => {
                G2.engine.activeModifiers.push(atom.modifier);
            }
        },
        {
            kind: 'modifier.remove',
            handler: (G2, _ctx, atom) => removeModifier(G2 as any, atom.sourceId)
        },
        { kind: 'rule.prohibit', handler: (G2, _ctx, atom) => handleRuleProhibit(G2 as any, atom) },
        { kind: 'rule.attribute', handler: (G2, _ctx, atom) => handleRuleAttribute(G2 as any, atom) },
        {
            kind: 'hook.trigger',
            handler: (G2, ctx2, atom) => opts.triggerHook(G2, ctx2, atom.hook, atom.payload)
        }
    ];
}

