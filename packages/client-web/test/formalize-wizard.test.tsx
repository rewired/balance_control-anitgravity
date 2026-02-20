import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { FormalizeWizardModal } from '../src/components/FormalizeWizardModal';
import { groupFormalizeIntents } from '../src/ui/interaction/formalizeHelpers';

afterEach(() => {
    cleanup();
});

describe('FormalizeWizardModal', () => {
    const G = {
        tiles: {
            'tile-1': { resort: 'dom', weight: 2 },
        },
        objects: {
            'res-1': { type: 'Resource', resort: 'dom' },
            'res-2': { type: 'Resource', resort: 'for' },
        }
    } as any;

    const intents = [
        {
            moveType: 'formalizeInfluence',
            payload: {
                committeeTileId: 'tile-1',
                paymentResourceIds: ['res-1'],
                extraResourceIds: []
            }
        },
        {
            moveType: 'formalizeInfluence',
            payload: {
                committeeTileId: 'tile-1',
                paymentResourceIds: ['res-1'],
                extraResourceIds: ['res-2']
            }
        }
    ] as any;

    it('renders the wizard when open', () => {
        const groupsMap = groupFormalizeIntents(intents);
        const groups = groupsMap.get('tile-1') || [];

        render(
            <FormalizeWizardModal
                open={true}
                G={G}
                committeeTileId="tile-1"
                groups={groups}
                onSelectIntent={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByTestId('formalize-wizard-modal')).toBeDefined();
        expect(screen.getByText('Committee: tile-1')).toBeDefined();
        expect(screen.getByText(/Resort: DOM/i)).toBeDefined();
    });

    it('calls onSelectIntent when an option is clicked', () => {
        const onSelectIntent = vi.fn();
        const groupsMap = groupFormalizeIntents(intents);
        const groups = groupsMap.get('tile-1') || [];

        render(
            <FormalizeWizardModal
                open={true}
                G={G}
                committeeTileId="tile-1"
                groups={groups}
                onSelectIntent={onSelectIntent}
                onClose={vi.fn()}
            />
        );

        const option = screen.getByText('Standard payment (no extras)');
        fireEvent.click(option);

        expect(onSelectIntent).toHaveBeenCalledWith(intents[0]);
    });

    it('calls onClose when cancel is clicked', () => {
        const onClose = vi.fn();
        const groupsMap = groupFormalizeIntents(intents);
        const groups = groupsMap.get('tile-1') || [];

        render(
            <FormalizeWizardModal
                open={true}
                G={G}
                committeeTileId="tile-1"
                groups={groups}
                onSelectIntent={vi.fn()}
                onClose={onClose}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});
