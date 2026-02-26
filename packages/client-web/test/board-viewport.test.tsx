import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BoardViewport } from '../src/components/BoardViewport';
import { computeBoardLayout } from '../src/ui/hexLayout';
import { computeFitTransform } from '../src/ui/fitToBounds';

let mockSetTransform: ((x: number, y: number, scale: number) => void) | undefined;
let lastOnTransformed: ((ref: unknown, state: { scale: number; positionX: number; positionY: number }) => void) | undefined;

vi.mock('react-zoom-pan-pinch', () => ({
    TransformWrapper: ({ children, onTransformed }: any) => {
        lastOnTransformed = onTransformed;
        return <div data-testid="mock-transform-wrapper">{children({ setTransform: mockSetTransform })}</div>;
    },
    TransformComponent: ({ children }: any) => <div data-testid="mock-transform-component">{children}</div>,
}));

const createRect = (width: number, height: number): DOMRect => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
} as DOMRect);

const renderDevViewport = () => render(
    <BoardViewport
        mode="dev"
        coordStrings={['0,0', '1,0', '1,1']}
        hexSize={100}
        renderContent={() => <div data-testid="board-content">content</div>}
    />
);

describe('BoardViewport', () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    let currentRect = createRect(900, 600);

    beforeEach(() => {
        mockSetTransform = vi.fn();
        lastOnTransformed = undefined;
        currentRect = createRect(900, 600);
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => currentRect);
        (globalThis as any).ResizeObserver = class {
            observe() {}
            disconnect() {}
        };
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        (globalThis as any).ResizeObserver = originalResizeObserver;
    });

    it('läuft ohne ResizeObserver und crasht nicht', () => {
        (globalThis as any).ResizeObserver = undefined;
        expect(() => renderDevViewport()).not.toThrow();
        expect(screen.getByTestId('btn-fit-to-board')).toBeDefined();
    });

    it('ruft applyFit bei fehlender Viewportgröße oder fehlendem setTransform nicht auf', () => {
        const setTransformSpy = vi.fn();
        mockSetTransform = setTransformSpy;
        currentRect = createRect(0, 0);
        renderDevViewport();
        fireEvent.click(screen.getByTestId('btn-fit-to-board'));
        expect(setTransformSpy).not.toHaveBeenCalled();

        cleanup();
        mockSetTransform = undefined;
        currentRect = createRect(900, 600);
        renderDevViewport();
        const viewport = screen.getByTestId('board-viewport');
        fireEvent.click(screen.getByTestId('btn-fit-to-board'));
        expect(viewport.dataset.baselineScale).toBeUndefined();
        expect(viewport.dataset.baselineTx).toBeUndefined();
        expect(viewport.dataset.baselineTy).toBeUndefined();
    });

    it('setzt baseline-Daten und ruft setTransform mit berechneten Werten auf', () => {
        const setTransformSpy = vi.fn();
        mockSetTransform = setTransformSpy;

        renderDevViewport();

        const viewport = screen.getByTestId('board-viewport');
        const layout = computeBoardLayout(['0,0', '1,0', '1,1'], 100);
        const expected = computeFitTransform(layout.contentBounds, { width: 900, height: 600 }, 48);

        expect(viewport.dataset.baselineScale).toBe(String(expected.scale));
        expect(viewport.dataset.baselineTx).toBe(String(expected.x));
        expect(viewport.dataset.baselineTy).toBe(String(expected.y));
        expect(setTransformSpy).toHaveBeenCalledWith(expected.x, expected.y, expected.scale);
    });

    it('resetView ist ohne baseline ein no-op und nutzt mit baseline die gespeicherten Werte', () => {
        const setTransformSpy = vi.fn();
        mockSetTransform = setTransformSpy;
        currentRect = createRect(0, 0);
        renderDevViewport();

        fireEvent.click(screen.getByTestId('btn-reset-view'));
        expect(setTransformSpy).not.toHaveBeenCalled();

        cleanup();
        currentRect = createRect(900, 600);
        renderDevViewport();
        const viewport = screen.getByTestId('board-viewport');
        const baselineScale = Number(viewport.dataset.baselineScale);
        const baselineTx = Number(viewport.dataset.baselineTx);
        const baselineTy = Number(viewport.dataset.baselineTy);

        setTransformSpy.mockClear();
        fireEvent.click(screen.getByTestId('btn-reset-view'));
        expect(setTransformSpy).toHaveBeenCalledWith(baselineTx, baselineTy, baselineScale);
    });

    it('onTransformed schreibt dataset.scale/tx/ty', () => {
        renderDevViewport();
        const viewport = screen.getByTestId('board-viewport');

        expect(lastOnTransformed).toBeTypeOf('function');
        lastOnTransformed?.({}, { scale: 1.75, positionX: 42, positionY: -13 });

        expect(viewport.dataset.scale).toBe('1.75');
        expect(viewport.dataset.tx).toBe('42');
        expect(viewport.dataset.ty).toBe('-13');
    });
});
