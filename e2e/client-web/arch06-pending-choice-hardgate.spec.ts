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
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    await page.addInitScript(() => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
    });
});

async function ensureActiveSeat(page: any, api: any) {
    const cur = await page.evaluate(() => (window as any).__BC_HOTSEAT_E2E_STATE__?.ctx?.currentPlayer);
    if (cur && cur !== '0') {
        const btn = page.getByTestId(`hotseat-switch-${cur}`);
        await expect(btn).toBeVisible();
        await btn.click();
    }
}

test('pendingChoice.selectOption is modal-driven and blocks board workflow', async ({ page }) => {
    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const api = await getHotseatApi(page);
    await ensureActiveSeat(page, api);

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
    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const api = await getHotseatApi(page);
    await ensureActiveSeat(page, api);

    const stateIDBefore = await api.evaluate((h: HotseatE2EApi) => h.getStateID());

    // The boardState line was likely for context, not directly used in the tile selection below.
    // const boardState = await api.evaluate((h: HotseatE2EApi) => h.getState().G.zones['Board']);
    const targetCoordToken = '0,0'; // Ensure this matches an actual tile placement
    const selectedTile = await page.evaluate((coordStr) => {
        const state = (window as any).__BC_HOTSEAT_E2E_STATE__;
        if (!state) return null;
        const grid = state.G.grid;
        // Search grid by coordinate
        const tileId = Object.entries(grid).find(([coord]) => coord === coordStr)?.[1];
        if (!tileId) return null;
        return { coordString: coordStr, tileId: tileId as string };
    }, targetCoordToken);

    expect(selectedTile).toBeDefined();
    if (selectedTile == null) {
        throw new Error('Expected at least one tileId→coord mapping entry from __BC_HOTSEAT_E2E_STATE__.G.grid.');
    }

    await api.evaluate((h: HotseatE2EApi, tileId: string) => {
        h.setPendingChoice({ kind: 'selectTile', spec: { tileIds: [tileId] }, player: '0' });
    }, selectedTile.tileId);

    await expect(page.getByTestId('pending-choice-overlay')).toHaveCount(0);

    const targetCoordId = selectedTile.coordString.replace(',', '_');
    const selectableTile = page.getByTestId(`hex-tile-${targetCoordId}`);

    await expect(selectableTile).toBeVisible();
    await selectableTile.click();

    const pendingKind = await api.evaluate((h: HotseatE2EApi) => h.getPendingChoiceKind());
    expect(pendingKind).toBeNull();

    const stateIDAfter = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(stateIDAfter).toBeGreaterThan(stateIDBefore ?? -1);
});
