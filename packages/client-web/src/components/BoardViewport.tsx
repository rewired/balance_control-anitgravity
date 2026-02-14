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
        setTransformRef.current(transform.x, transform.y, transform.scale);
    }, [layout.contentBounds, viewportSize]);

    useEffect(() => {
        applyFit();
    }, [applyFit]);

    return (
        <div className="board-viewport" ref={viewportRef}>
            <TransformWrapper
                minScale={0.25}
                maxScale={2.5}
                wheel={{ step: 0.1 }}
                panning={{ disabled: false }}
                doubleClick={{ disabled: true }}
            >
                {({ setTransform }) => {
                    setTransformRef.current = setTransform;
                    return (
                        <>
                            <button className="board-viewport-reset" onClick={applyFit}>
                                Reset view
                            </button>
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
