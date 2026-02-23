import { z } from 'zod';

export const resolveChoicePayloadSchema = z.object({
    choiceId: z.string(),
    selection: z.unknown(),
}).strict();

export const placeInfluencePayloadSchema = z.object({
    targetTileId: z.string(),
    extraResourceIds: z.array(z.string()).optional(),
}).strict();

export const moveInfluencePayloadSchema = z.object({
    sourceId: z.string(),
    targetId: z.string(),
    extraResourceIds: z.array(z.string()).optional(),
}).strict();

export const formalizeInfluencePayloadSchema = z.object({
    committeeTileId: z.string(),
    paymentResourceIds: z.array(z.string()),
    extraResourceIds: z.array(z.string()).optional(),
}).strict();

export const convertResourcesPayloadSchema = z.object({
    grassrootsTileId: z.string(),
    inputResourceIds: z.array(z.string()),
    outputResort: z.string().min(1),
    extraResourceIds: z.array(z.string()).optional(),
}).strict();

export const placeTilePayloadSchema = z.object({
    targetCoord: z.string(),
    extraResourceIds: z.array(z.string()).optional(),
}).strict();

export type ResolveChoicePayload = z.infer<typeof resolveChoicePayloadSchema>;
export type PlaceInfluencePayload = z.infer<typeof placeInfluencePayloadSchema>;
export type MoveInfluencePayload = z.infer<typeof moveInfluencePayloadSchema>;
export type FormalizeInfluencePayload = z.infer<typeof formalizeInfluencePayloadSchema>;
export type ConvertResourcesPayload = z.infer<typeof convertResourcesPayloadSchema>;
export type PlaceTilePayload = z.infer<typeof placeTilePayloadSchema>;

/**
 * Validates a move payload against a schema.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function validateMovePayload<TSchema extends z.ZodTypeAny>(
    moveName: string,
    schema: TSchema,
    payload: unknown
): { ok: true; value: z.infer<TSchema> } | { ok: false } {
    const result = schema.safeParse(payload);

    if (!result.success) {
        const details = result.error.issues
            .map((issue: z.ZodIssue) => {
                const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
                return `${path}: ${issue.message}`;
            })
            .join('; ');
        console.error(`[move:${moveName}] invalid payload: ${details}`);
        return { ok: false };
    }

    return { ok: true, value: result.data };
}
