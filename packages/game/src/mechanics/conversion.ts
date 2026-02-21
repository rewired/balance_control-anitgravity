import { TileType } from '@balance-control/rules';

export interface GrassrootsConversionSpec {
    inputSlots: number;
    outputSlots: number;
}

export const CORE_RESORTS = ['DOM', 'FOR', 'INF'];

/**
 * Checks if a resort is a core resort.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function isCoreResort(resort: string): boolean {
    return CORE_RESORTS.includes(resort);
}

/**
 * Validates declared variant and returns spec for Grassroots conversion.
 * @rule CORE-01-04-22K
 * @rule CORE-01-04-22L
 * @rule CORE-01-04-22L.1
 * @deterministic
 * @pure
 */
export function getGrassrootsConversionSpec(tile: any, inputCount: number, outputResort?: string): GrassrootsConversionSpec | null {
    if (!tile || tile.type !== TileType.Grassroots) return null;
    const spec = tile.conversion;
    if (!spec || typeof spec.inputSlots !== 'number') return null;

    const typedResort = spec.typedResort ?? tile.resort;
    const isTyped = Boolean(typedResort) || spec.inputSlots === 2;

    if (isTyped) {
        // Variant A: 2 inputs -> output must be fixed to T (if provided)
        if (inputCount === 2) {
            if (outputResort && typedResort && outputResort !== typedResort) return null;
            return { inputSlots: 2, outputSlots: 1 };
        }
        // Variant B: 3 inputs -> output must NOT be T (if T exists)
        if (inputCount === 3) {
            // CORE-01-04-22L Variant B: output must be ≠ T (only when T exists)
            if (outputResort && typedResort && outputResort === typedResort) return null;
            return { inputSlots: 3, outputSlots: 1 };
        }
        return null;
    }

    // Untyped CORE-01-04-22K: 3 inputs only, any core resort output
    if (inputCount === 3) {
        return { inputSlots: 3, outputSlots: 1 };
    }

    return null;
}

/**
 * Enumerates all legal output resorts for a given Grassroots tile and input count.
 * @rule CORE-01-04-22K
 * @rule CORE-01-04-22L
 * @deterministic
 * @pure
 */
export function getLegalGrassrootsOutputs(tile: any, inputCount: number): string[] {
    if (!tile || tile.type !== TileType.Grassroots) return [];
    const spec = tile.conversion;
    if (!spec || typeof spec.inputSlots !== 'number') return [];

    const typedResort = spec.typedResort ?? tile.resort;
    const isTyped = Boolean(typedResort) || spec.inputSlots === 2;

    if (isTyped) {
        if (inputCount === 2) {
            // Variant A: Fixed to T if T exists, otherwise anything? 
            // Spec says "Typed Grassroots with tag T". If it's typed but has no T, it's ill-formed.
            return typedResort ? [typedResort] : [...CORE_RESORTS];
        }
        if (inputCount === 3) {
            // Variant B: Output ≠ T
            return typedResort ? CORE_RESORTS.filter(r => r !== typedResort) : [...CORE_RESORTS];
        }
        return [];
    }

    // Untyped: 3 inputs only
    if (inputCount === 3) {
        return [...CORE_RESORTS];
    }

    return [];
}
