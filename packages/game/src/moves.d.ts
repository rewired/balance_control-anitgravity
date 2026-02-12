export declare const CoreMoves: {
    placeInfluence: ({ G, ctx, events }: any, { tileId, extraResourceIds }: {
        tileId: string;
        extraResourceIds?: string[];
    }) => "INVALID_MOVE" | undefined;
    moveInfluence: ({ G, ctx, events }: any, { sourceId, targetId, extraResourceIds }: {
        sourceId: string;
        targetId: string;
        extraResourceIds?: string[];
    }) => "INVALID_MOVE" | undefined;
    formalizeInfluence: ({ G, ctx, events }: any, { committeeTileId, paymentResourceIds, extraResourceIds }: {
        committeeTileId: string;
        paymentResourceIds: string[];
        extraResourceIds?: string[];
    }) => "INVALID_MOVE" | undefined;
    convertResources: ({ G, ctx, events }: any, { grassrootsTileId, inputResourceIds, extraResourceIds }: {
        grassrootsTileId: string;
        inputResourceIds: string[];
        extraResourceIds?: string[];
    }) => "INVALID_MOVE" | undefined;
    placeTile: ({ G, ctx, events }: any, targetCoord: string) => "INVALID_MOVE" | undefined;
    takeMeasure: ({ G, ctx, events }: any, measureObjectId: string) => "INVALID_MOVE" | undefined;
    playMeasure: ({ G, ctx, events }: any, measureObjectId: string, targetPayload: any) => "INVALID_MOVE" | undefined;
    pass: ({ G, ctx, events }: any) => void;
};
//# sourceMappingURL=moves.d.ts.map