import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MeasureTray } from '../src/components/MeasureTray';

afterEach(() => {
    cleanup();
});

describe('MeasureTray', () => {
    const mockG = {
        objects: {
            'm1': { type: 'Measure', measureId: 'Measure A' },
            'm2': { type: 'Measure' } // No measureId, should fallback to objectId
        }
    } as any;

    const mockIntents = [
        {
            moveType: 'exp01.takeMeasure',
            payload: 'm1'
        },
        {
            moveType: 'exp02.takeMeasure',
            payload: 'm2'
        }
    ] as any;

    it('renders measures grouped by expansion', () => {
        render(
            <MeasureTray
                G={mockG}
                intents={mockIntents}
                onSelect={vi.fn()}
            />
        );

        expect(screen.getByText('exp01')).toBeDefined();
        expect(screen.getByText('exp02')).toBeDefined();
        expect(screen.getByText('Measure A')).toBeDefined();
        expect(screen.getByText('m2')).toBeDefined();
    });

    it('calls onSelect when a measure is clicked', () => {
        const onSelect = vi.fn();
        render(
            <MeasureTray
                G={mockG}
                intents={mockIntents}
                onSelect={onSelect}
            />
        );

        fireEvent.click(screen.getByText('Measure A'));
        expect(onSelect).toHaveBeenCalledWith(mockIntents[0]);
    });
});
