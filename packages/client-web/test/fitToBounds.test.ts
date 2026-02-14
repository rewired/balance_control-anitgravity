import { describe, it, expect } from 'vitest';
import { computeFitTransform } from '../src/ui/fitToBounds';

describe('computeFitTransform', () => {
    it('fits bounds into viewport with padding', () => {
        const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 50 };
        const viewport = { width: 200, height: 200 };
        const result = computeFitTransform(bounds, viewport, 10);
        expect(result.scale).toBeCloseTo(1.8, 5);
        expect(result.x).toBeCloseTo(10, 5);
        expect(result.y).toBeCloseTo(55, 5);
    });

    it('centers bounds with non-zero origin', () => {
        const bounds = { minX: 50, minY: 25, maxX: 150, maxY: 75 };
        const viewport = { width: 200, height: 200 };
        const result = computeFitTransform(bounds, viewport, 0);
        expect(result.scale).toBeCloseTo(2, 5);
        expect(result.x).toBeCloseTo(-100, 5);
        expect(result.y).toBeCloseTo(0, 5);
    });

    it('returns identity for empty bounds or viewport', () => {
        const bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        const viewport = { width: 0, height: 200 };
        const result = computeFitTransform(bounds, viewport, 20);
        expect(result).toEqual({ scale: 1, x: 0, y: 0 });
    });
});
