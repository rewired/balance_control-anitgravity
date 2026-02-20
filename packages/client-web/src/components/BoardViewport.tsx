import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, Tile } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { HexBoard, HEX_SIZE } from './HexBoard';
import type { BoardLayout } from '../ui/hexLayout';
import { computeBoardLayout, stableSortCoords } from '../ui/hexLayout';
import { computeFitTransform } from '../ui/fitToBounds';

type BoardViewportGameProps = {
    mode?: undefined | 'game';
    G: GameState;
    placeTileIntents: LegalIntent[];
    moveInfluenceIntents?: LegalIntent[];
    placeInfluenceIntents?: LegalIntent[];
    formalizeInfluenceIntents?: LegalIntent[];
    convertResourcesIntents?: LegalIntent[];
    resolveChoiceIntents?: LegalIntent[];
    actionMode?: string;
    moveInfluenceSourceId?: string | null;
    ghostCoords: string[];
    isInteractive: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
    onProposeMove?: (intent: LegalIntent) => void;
    onResolveChoice?: (intent: LegalIntent) => void;
    pendingTile?: Tile | null;
    activePlayerId?: string;
    draftIntent?: LegalIntent | null;
};

type BoardViewportDevProps = {
    mode: 'dev';
    coordStrings: string[];
    hexSize: number;
    renderContent: (layout: BoardLayout) => React.ReactNode;
};

type BoardViewportProps = BoardViewportGameProps | BoardViewportDevProps;

const FIT_PADDING = 48;

/**
 * @remarks
 * Presentation-only. Must not compute legality/cost/majority/modifiers (ARCH-01).
 * @see /docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 */
export const BoardViewport: React.FC<BoardViewportProps> = (props) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const setTransformRef = useRef<((x: number, y: number, scale: number) => void) | null>(null);
    const baselineTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

    const devProps = props.mode === 'dev' ? (props as BoardViewportDevProps) : null;
    const gameProps = props.mode === 'dev' ? null : (props as BoardViewportGameProps);
    const isDevViewport = Boolean(devProps);
    const hexSize = devProps ? devProps.hexSize : HEX_SIZE;

    useEffect(() => {
        const node = viewportRef.current;
        if (!node) return;
        const updateSize = () => {
            const rect = node.getBoundingClientRect();
            setViewportSize({ width: rect.width, height: rect.height });
        };
        updateSize();
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const occupiedCoords = useMemo(() => {
        if (devProps) {
            return stableSortCoords(devProps.coordStrings);
        }
        return stableSortCoords(Object.keys(gameProps?.G.grid || {}));
    }, [devProps?.coordStrings, gameProps?.G.grid, props.mode]);

    const allCoords = useMemo(() => {
        const ghosts = devProps ? [] : (gameProps?.ghostCoords ?? []);
        return stableSortCoords([...occupiedCoords, ...ghosts]);
    }, [occupiedCoords, devProps, gameProps?.ghostCoords]);

    const layout = useMemo(() => {
        return computeBoardLayout(allCoords, hexSize);
    }, [allCoords, hexSize]);

    const applyFit = useCallback(() => {
        if (!setTransformRef.current) return;
        if (!viewportSize.width || !viewportSize.height) return;
        const transform = computeFitTransform(layout.contentBounds, viewportSize, FIT_PADDING);
        baselineTransformRef.current = transform;
        const node = viewportRef.current;
        if (node) {
            node.dataset.baselineScale = String(transform.scale);
            node.dataset.baselineTx = String(transform.x);
            node.dataset.baselineTy = String(transform.y);
        }
        setTransformRef.current(transform.x, transform.y, transform.scale);
    }, [layout.contentBounds, viewportSize]);

    const resetView = useCallback(() => {
        const baseline = baselineTransformRef.current;
        if (!setTransformRef.current || !baseline) return;
        setTransformRef.current(baseline.x, baseline.y, baseline.scale);
    }, []);

    const handleTransformed = useCallback((_ref: any, state: { scale: number; positionX: number; positionY: number }) => {
        const node = viewportRef.current;
        if (!node) return;
        node.dataset.scale = String(state.scale);
        node.dataset.tx = String(state.positionX);
        node.dataset.ty = String(state.positionY);
    }, []);

    useEffect(() => {
        applyFit();
    }, [applyFit]);

    return (
        <div className="board-viewport" ref={viewportRef} data-testid="board-viewport">
            <TransformWrapper
                minScale={0.25}
                maxScale={2.5}
                wheel={{ step: 0.1, excluded: ['board-viewport-controls'] }}
                panning={{ disabled: false, excluded: ['board-viewport-controls'] }}
                doubleClick={{ disabled: true }}
                onTransformed={handleTransformed}
            >
                {({ setTransform }) => {
                    setTransformRef.current = setTransform;
                    return (
                        <>
                            <div className="board-viewport-controls">
                                <button className="board-viewport-fit" onClick={applyFit} data-testid="btn-fit-to-board">
                                    Fit to board
                                </button>
                                <button className="board-viewport-reset" onClick={resetView} data-testid="btn-reset-view">
                                    Reset view
                                </button>
                            </div>
                            <TransformComponent
                                wrapperClass="board-viewport-wrapper"
                                contentClass="board-viewport-content"
                            >
                                {devProps
                                    ? devProps.renderContent(layout)
                                    : (
                                        <HexBoard
                                            G={gameProps!.G}
                                            placeTileIntents={gameProps!.placeTileIntents}
                                            moveInfluenceIntents={gameProps!.moveInfluenceIntents}
                                            placeInfluenceIntents={gameProps!.placeInfluenceIntents}
                                            formalizeInfluenceIntents={gameProps!.formalizeInfluenceIntents}
                                            convertResourcesIntents={gameProps!.convertResourcesIntents}
                                            resolveChoiceIntents={gameProps!.resolveChoiceIntents}
                                            actionMode={gameProps!.actionMode}
                                            moveInfluenceSourceId={gameProps!.moveInfluenceSourceId}
                                            ghostCoords={gameProps!.ghostCoords}
                                            isInteractive={gameProps!.isInteractive}
                                            selectedTileId={gameProps!.selectedTileId}
                                            selectedCoord={gameProps!.selectedCoord}
                                            onSelectTile={gameProps!.onSelectTile}
                                            onProposeMove={gameProps!.onProposeMove}
                                            onResolveChoice={gameProps!.onResolveChoice}
                                            pendingTile={gameProps!.pendingTile}
                                            activePlayerId={gameProps!.activePlayerId}
                                            draftIntent={gameProps!.draftIntent}
                                        />
                                    )}
                            </TransformComponent>
                        </>
                    );
                }}
            </TransformWrapper>
        </div>
    );
};
