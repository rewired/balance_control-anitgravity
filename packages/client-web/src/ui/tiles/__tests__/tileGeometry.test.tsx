import { describe, it, expect } from 'vitest';
import { HEX_NORMALIZED_PATH_POINTS, INFLUENCE_MARKER_CENTERS_ABS, VIEWBOX } from '../tileGeometry';

describe('Hex Geometry Consistency', () => {
    it('HEX_NORMALIZED_PATH_POINTS matches INFLUENCE_MARKER_CENTERS_ABS scaling', () => {
        const [vx, vy, vw, vh] = VIEWBOX;

        // Map INFLUENCE_MARKER_CENTERS_ABS to array in the order: 2, 3, 4, 5, 6, 1
        // (Top, TR, BR, B, BL, TL)
        const absPoints = [
            INFLUENCE_MARKER_CENTERS_ABS[2],
            INFLUENCE_MARKER_CENTERS_ABS[3],
            INFLUENCE_MARKER_CENTERS_ABS[4],
            INFLUENCE_MARKER_CENTERS_ABS[5],
            INFLUENCE_MARKER_CENTERS_ABS[6],
            INFLUENCE_MARKER_CENTERS_ABS[1],
        ];

        absPoints.forEach((pt, i) => {
            const normPt = HEX_NORMALIZED_PATH_POINTS[i];
            expect(normPt[0]).toBeCloseTo(pt[0] / vw, 10);
            expect(normPt[1]).toBeCloseTo(pt[1] / vh, 10);
        });
    });

    it('points are within 0..1 range (with tolerance)', () => {
        HEX_NORMALIZED_PATH_POINTS.forEach(([x, y]) => {
            expect(x).toBeGreaterThanOrEqual(-0.001);
            expect(x).toBeLessThanOrEqual(1.001);
            expect(y).toBeGreaterThanOrEqual(-0.001);
            expect(y).toBeLessThanOrEqual(1.001);
        });
    });
});
