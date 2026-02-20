import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { ConvertWizardModal } from '../src/components/ConvertWizardModal';
import { groupConvertIntents } from '../src/ui/interaction/convertHelpers';

afterEach(() => {
    cleanup();
});

describe('ConvertWizardModal', () => {
    const mockG = {
        objects: {
            'r1': { type: 'Resource', resort: 'DOM' },
            'r2': { type: 'Resource', resort: 'FOR' },
            'r3': { type: 'Resource', resort: 'INF' }
        },
        tiles: {
            'T1': { type: 'Grassroots', resort: 'DOM' }
        }
    } as any;

    const mockIntents = [
        {
            moveType: 'convertResources',
            payload: {
                grassrootsTileId: 'T1',
                outputResort: 'INF',
                inputResourceIds: ['r1', 'r2']
            }
        },
        {
            moveType: 'convertResources',
            payload: {
                grassrootsTileId: 'T1',
                outputResort: 'DOM',
                inputResourceIds: ['r2', 'r3']
            }
        }
    ] as any;

    const tileGroups = groupConvertIntents(mockIntents);
    const tileGroup = tileGroups.get('T1')!;

    it('renders output resort options initially', () => {
        render(
            <ConvertWizardModal
                open={true}
                G={mockG}
                grassrootsTileId="T1"
                tileGroup={tileGroup}
                onSelectIntent={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('INF')).toBeDefined();
        expect(screen.getByText('DOM')).toBeDefined();
    });

    it('renders input combo options after selecting output', () => {
        render(
            <ConvertWizardModal
                open={true}
                G={mockG}
                grassrootsTileId="T1"
                tileGroup={tileGroup}
                onSelectIntent={vi.fn()}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('INF'));

        expect(screen.getByText('Use: DOM, FOR')).toBeDefined();
        expect(screen.getByText('Standard cost (no extras)')).toBeDefined();
    });

    it('calls onSelectIntent when a combo is clicked', () => {
        const onSelectIntent = vi.fn();
        render(
            <ConvertWizardModal
                open={true}
                G={mockG}
                grassrootsTileId="T1"
                tileGroup={tileGroup}
                onSelectIntent={onSelectIntent}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('INF'));
        fireEvent.click(screen.getByText('Standard cost (no extras)'));

        expect(onSelectIntent).toHaveBeenCalledWith(mockIntents[0]);
    });
});
