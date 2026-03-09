import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { useEffect, useMemo, useRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { INVALID_MOVE } from 'boardgame.io/core';
import { I18nProvider } from '../src/ui/i18n';
import { useGameInteractionController } from '../src/ui/interaction/useGameInteractionController';
import { PublicNoticeOverlay } from '../src/components/PublicNoticeOverlay';

const mockEnumerateLegalIntents = vi.fn();

vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<any>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: (...args: any[]) => mockEnumerateLegalIntents(...args)
    };
});

afterEach(() => {
    cleanup();
    mockEnumerateLegalIntents.mockReset();
});

function createMinimalState(): any {
    return {
        zones: {
            staging_0: { id: 'staging_0', name: 'Staging', items: [] }
        },
        tiles: {},
        objects: {},
        adjacency: {},
        grid: {},
        engine: { attributes: { publicLog: [] }, pendingChoice: null }
    };
}

const baseCtx = { currentPlayer: '0', turn: 0, phase: 'main', activePlayers: { '0': 'drawAndPlace' } };

const Harness: React.FC<{ moves: any }> = ({ moves }) => {
    const G = useMemo(() => createMinimalState(), []);
    const controller = useGameInteractionController({ G, ctx: baseCtx, playerID: '0', moves });
    const didConfirm = useRef(false);

    useEffect(() => {
        controller.proposeIntent({ moveType: 'badMove', payload: { x: 1 } } as any);
    }, [controller.proposeIntent]);

    useEffect(() => {
        if (controller.proposedIntent && !didConfirm.current) {
            didConfirm.current = true;
            controller.confirmDraft();
        }
    }, [controller.proposedIntent, controller.confirmDraft]);

    return <PublicNoticeOverlay G={G} uiNotices={controller.uiNotices} />;
};

describe('Hotseat diagnostics: invalid move feedback', () => {
    it('shows a toast when dispatch is rejected (INVALID_MOVE)', async () => {
        mockEnumerateLegalIntents.mockReturnValue([
            { moveType: 'badMove', payload: { x: 1 } }
        ]);


        const moves = {
            badMove: vi.fn(() => INVALID_MOVE)
        };

        render(
            <I18nProvider>
                <Harness moves={moves} />
            </I18nProvider>
        );

        expect(await screen.findByTestId('ui-toast-dispatch.rejected')).toBeTruthy();
        expect(screen.getByText('Move rejected')).toBeTruthy();
        expect(screen.getByText(/"badMove"/)).toBeTruthy();
    });
});
