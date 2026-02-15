import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '@balance-control/rules';
import type { LegalIntent } from '@balance-control/game';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { HexBoard, HEX_SIZE } from './HexBoard';
import { computeBoardLayout, stableSortCoords } from '../ui/hexLayout';
import { computeFitTransform } from '../ui/fitToBounds';

interface BoardViewportProps {
    G: GameState;
    moves: any;
    intents: LegalIntent[];
    isInteractive: boolean;
    selectedTileId?: string | null;
    selectedCoord?: string | null;
    onSelectTile?: (tileId: string, coordStr: string) => void;
}

const FIT_PADDING = 48;

export const BoardViewport: React.FC<BoardViewportProps> = ({
    G,
    moves,
    intents,
    isInteractive,
    selectedTileId,
    selectedCoord,
    onSelectTile
}) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const setTransformRef = useRef<((x: number, y: number, scale: number) => void) | null>(null);
    const baselineTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

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
        return stableSortCoords(Object.keys(G.grid || {}));
    }, [G.grid]);

    const ghostCoords = useMemo(() => {
        const coords = intents
            .filter((intent) => intent.moveType === 'placeTile' && intent.payload?.targetCoord)
            .map((intent) => intent.payload.targetCoord);
        const unique = Array.from(new Set(coords));
        return stableSortCoords(unique);
    }, [intents]);

    const allCoords = useMemo(() => {
        return stableSortCoords([...occupiedCoords, ...ghostCoords]);
    }, [occupiedCoords, ghostCoords]);

    const layout = useMemo(() => {
        return computeBoardLayout(allCoords, HEX_SIZE);
    }, [allCoords]);

    const applyFit = useCallback(() => {
        if (!setTransformRef.current) return;
        if (!viewportSize.width || !viewportSize.height) return;
        const transform = computeFitTransform(layout.contentBounds, viewportSize, FIT_PADDING);
<<<<<<< HEAD
        baselineTransformRef.current = transform;
        const node = viewportRef.current;
        if (node) {
            node.dataset.baselineScale = String(transform.scale);
            node.dataset.baselineTx = String(transform.x);
            node.dataset.baselineTy = String(transform.y);
=======
        if (!baselineTransformRef.current) {
            baselineTransformRef.current = transform;
>>>>>>> 0fb5f2c821b98258fac84e3203d82072a965d7c0
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
                                <HexBoard
                                    G={G}
                                    moves={moves}
                                    intents={intents}
                                    isInteractive={isInteractive}
                                    selectedTileId={selectedTileId}
                                    selectedCoord={selectedCoord}
                                    onSelectTile={onSelectTile}
                                />
                            </TransformComponent>
                        </>
                    );
                }}
            </TransformWrapper>
        </div>
    );
};
