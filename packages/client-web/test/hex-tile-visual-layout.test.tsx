import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { HexTileVisual } from '../src/ui/tiles/HexTileVisual';

describe('HexTileVisual Layout', () => {
    it('renders resortIcon and valueW with different vertical positions when both are present', () => {
        const { container } = render(
            <HexTileVisual
                majoritySeat={null}
                seatColor={() => '#000'}
                isHovered={false}
                isSelected={false}
                influenceBySeat={{}}
                metaMarkers={[]}
                badges={[]}
                resortIcon={<rect data-testid="test-icon" width="24" height="24" />}
                valueW={5}
            />
        );

        // The first g inside the content layer which has the translate
        const iconGroup = container.querySelector('g g[transform*="translate"]');
        const textElement = container.querySelector('text');

        expect(iconGroup).toBeTruthy();
        expect(textElement).toBeTruthy();

        const transform = iconGroup!.getAttribute('transform');
        const iconYMatch = transform?.match(/translate\([\d.]+ ([\d.-]+)\)/);
        const iconY = iconYMatch ? parseFloat(iconYMatch[1]) : null;

        const textY = parseFloat(textElement!.getAttribute('y') || '0');

        expect(iconY).not.toBeNull();
        expect(iconY).not.toBe(textY);

        // Expected iconY ~ 431.6 - 115 = 316.6
        // Expected textY ~ 431.6 + 85 = 516.6
        expect(iconY).toBeCloseTo(316.625, 1);
        expect(textY).toBeCloseTo(516.625, 1);
    });

    it('renders only resortIcon at its default position when valueW is missing', () => {
        const { container } = render(
            <HexTileVisual
                majoritySeat={null}
                seatColor={() => '#000'}
                isHovered={false}
                isSelected={false}
                influenceBySeat={{}}
                metaMarkers={[]}
                badges={[]}
                resortIcon={<rect data-testid="test-icon" width="24" height="24" />}
            />
        );

        const iconGroup = container.querySelector('g g[transform*="translate"]');
        const textElement = container.querySelector('text');

        expect(iconGroup).toBeTruthy();
        expect(textElement).toBeNull();

        const transform = iconGroup!.getAttribute('transform');
        const iconYMatch = transform?.match(/translate\([\d.]+ ([\d.-]+)\)/);
        const iconY = iconYMatch ? parseFloat(iconYMatch[1]) : null;

        // Default cy - 60 = 431.625 - 60 = 371.625
        expect(iconY).toBeCloseTo(371.625, 1);
    });

    it('renders only valueW at its default position when resortIcon is missing', () => {
        const { container } = render(
            <HexTileVisual
                majoritySeat={null}
                seatColor={() => '#000'}
                isHovered={false}
                isSelected={false}
                influenceBySeat={{}}
                metaMarkers={[]}
                badges={[]}
                valueW={5}
            />
        );

        const iconGroup = container.querySelector('g g[transform*="translate"]');
        const textElement = container.querySelector('text');

        expect(iconGroup).toBeNull();
        expect(textElement).toBeTruthy();

        const textY = parseFloat(textElement!.getAttribute('y') || '0');

        // Default cy - 10 = 431.625 - 10 = 421.625
        expect(textY).toBeCloseTo(421.625, 1);
    });

    it('renders typeIcon and typeTag for Typed Grassroots', () => {
        const { getByText, container } = render(
            <HexTileVisual
                majoritySeat={null}
                seatColor={() => '#000'}
                isHovered={false}
                isSelected={false}
                influenceBySeat={{}}
                metaMarkers={[]}
                badges={[]}
                typeIcon={<rect data-testid="type-icon" width="24" height="24" />}
                typeTag="DOM"
            />
        );

        const iconGroup = container.querySelector('g g[transform*="translate"]');
        const textElement = getByText('DOM');

        expect(iconGroup).toBeTruthy();
        expect(textElement).toBeTruthy();

        const transform = iconGroup!.getAttribute('transform');
        const iconYMatch = transform?.match(/translate\([\d.]+ ([\d.-]+)\)/);
        const iconY = iconYMatch ? parseFloat(iconYMatch[1]) : null;

        const textY = parseFloat(textElement.getAttribute('y') || '0');

        // Expected iconY ~ 431.6 - 115 = 316.6
        expect(iconY).toBeCloseTo(316.625, 1);

        // Expected textY ~ 431.6 + 85 = 516.6
        expect(textY).toBeCloseTo(516.625, 1);
    });
});
