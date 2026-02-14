import { describe, it, expect } from 'vitest';
import { axialToPixel, computeBounds, parseCoordString } from '../src/ui/hexLayout';

describe('hexLayout', () => {
    it('converts axial coords to pixel coords deterministically', () => {
        const size = 10;
        expect(axialToPixel({ q: 0, r: 0 }, size)).toEqual({ x: 0, y: 0 });
        const { x, y } = axialToPixel({ q: 1, r: 0 }, size);
        expect(x).toBeCloseTo(Math.sqrt(3) * size, 5);
        expect(y).toBeCloseTo(0, 5);
    });

    it('computes bounds for a small coord set', () => {
        const size = 10;
        const coords = [
            parseCoordString('0,0'),
            parseCoordString('1,0'),
            parseCoordString('0,1')
        ];
        const bounds = computeBounds(coords, size);
        expect(bounds.minX).toBeCloseTo(0, 5);
        expect(bounds.minY).toBeCloseTo(0, 5);
        expect(bounds.maxX).toBeCloseTo(Math.sqrt(3) * size, 5);
        expect(bounds.maxY).toBeCloseTo(15, 5);
    });
});
