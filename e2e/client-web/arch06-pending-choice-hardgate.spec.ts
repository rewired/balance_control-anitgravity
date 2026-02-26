/**
 * ARCH-06 contract coverage:
 * - PendingChoice Hard-Gate behavior (`selectTile` vs modal-driven)
 *
 * Contract: docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md
 */
import { expect, test } from '@playwright/test';

type HotseatE2EApi = {
    getStateID: () => number | null;
    getPendingChoiceKind: () => string | null;
    setPendingChoice: (pendingChoice: { kind: string; spec?: Record<string, unknown>; player?: string }) => void;
    clearPendingChoice: () => void;
};

async function getHotseatApi(page: any) {
    await page.waitForFunction(() => Boolean((window as any).__BC_HOTSEAT_E2E__), undefined, {
        timeout: 10_000,
    });
    const hotseatApi = await page.evaluateHandle(() => (window as any).__BC_HOTSEAT_E2E__ as HotseatE2EApi);
    if ((await hotseatApi.evaluate((api: HotseatE2EApi | null) => api === null)) === true) {
        throw new Error('ARCH-06 E2E hook missing: window.__BC_HOTSEAT_E2E__ is null after wait timeout.');
    }
    return hotseatApi;
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
    });

    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();
});

test('pendingChoice.selectOption is modal-driven and blocks board workflow', async ({ page }) => {
    const api = await getHotseatApi(page);

    await api.evaluate((h: HotseatE2EApi) => {
        h.setPendingChoice({ kind: 'selectOption', spec: { options: ['A', 'B'] } });
    });

    await expect(page.getByTestId('pending-choice-overlay')).toBeVisible();
    await expect(page.getByTestId('pending-choice-confirm')).toBeDisabled();

    await page.getByTestId('pending-choice-option-0').click();
    await expect(page.getByTestId('pending-choice-confirm')).toBeEnabled();
    await page.getByTestId('pending-choice-confirm').click();

    await expect(page.getByTestId('pending-choice-overlay')).toBeHidden();

    const pendingKind = await api.evaluate((h: HotseatE2EApi) => h.getPendingChoiceKind());
    expect(pendingKind).toBeNull();
});

test('pendingChoice.selectTile stays board-driven and does not render blocking modal', async ({ page }) => {
    const api = await getHotseatApi(page);

    const stateIDBefore = await api.evaluate((h: HotseatE2EApi) => h.getStateID());

    const selectedTile = await page.evaluate(() => {
        const grid = (window as any).__BC_HOTSEAT_E2E_STATE__?.G?.grid;
        if (grid == null || typeof grid !== 'object') {
            return null;
        }

        const tileIdToCoord = Object.entries(grid).reduce<Record<string, string>>((acc, [coord, tileId]) => {
            if (typeof tileId === 'string') {
                acc[tileId] = coord;
            }
            return acc;
        }, {});

        const [tileId] = Object.keys(tileIdToCoord).sort();
        if (tileId == null) {
            return null;
        }

        return { tileId, coord: tileIdToCoord[tileId] };
    });
    expect(selectedTile).toBeTruthy();
    if (selectedTile == null) {
        throw new Error('Expected at least one tileId→coord mapping entry from __BC_HOTSEAT_E2E_STATE__.G.grid.');
    }

    await api.evaluate((h: HotseatE2EApi, tileId: string) => {
        h.setPendingChoice({ kind: 'selectTile', spec: { tileIds: [tileId] } });
    }, selectedTile.tileId);

    await expect(page.getByTestId('pending-choice-overlay')).toHaveCount(0);

    const targetCoordToken = selectedTile.coord.replace(',', '_');
    const selectableTile = page.getByTestId(`hex-tile-${targetCoordToken}`);

    await expect(selectableTile).toBeVisible();
    await selectableTile.click();

    const pendingKind = await api.evaluate((h: HotseatE2EApi) => h.getPendingChoiceKind());
    expect(pendingKind).toBeNull();

    const stateIDAfter = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(stateIDAfter).toBeGreaterThan(stateIDBefore ?? -1);
});
