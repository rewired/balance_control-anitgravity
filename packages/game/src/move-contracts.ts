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
    paymentResourceIds: z.array(z.string()).optional(),
    paymentResorts: z.array(z.string()).optional(),
    extraResourceIds: z.array(z.string()).optional(),
}).strict().superRefine((value, ctx) => {
    if (!value.paymentResourceIds && !value.paymentResorts) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['paymentResourceIds'],
            message: 'either paymentResourceIds or paymentResorts is required'
        });
    }
});

const convertResourcesInputCountSchema = z.number().int().refine((count) => count === 2 || count === 3, {
    message: 'inputCount must be 2 or 3'
});

export const convertResourcesPayloadSchema = z.object({
    grassrootsTileId: z.string(),
    inputCount: convertResourcesInputCountSchema.optional(),
    inputResourceIds: z.array(z.string()).optional(),
    outputResort: z.string().min(1),
    extraResourceIds: z.array(z.string()).optional(),
}).strict().superRefine((value, ctx) => {
    const declaredCount = value.inputCount ?? value.inputResourceIds?.length;
    if (!declaredCount) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['inputCount'],
            message: 'either inputCount or inputResourceIds is required'
        });
        return;
    }

    if (declaredCount !== 2 && declaredCount !== 3) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['inputCount'],
            message: 'declared input count must be 2 or 3'
        });
        return;
    }

    if (value.inputResourceIds) {
        if (value.inputResourceIds.length !== declaredCount) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['inputResourceIds'],
                message: 'inputResourceIds length must match inputCount'
            });
        }
    }
});

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
