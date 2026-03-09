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

async function ensureActiveSeat(page: any) {
    const seat0Btn = page.getByTestId('hotseat-switch-0');
    await expect(seat0Btn).toBeVisible();
    if (!(await seat0Btn.isDisabled())) {
        await seat0Btn.click();
    }
}

async function waitForStateIDIncrease(page: any, api: any, before: number | null, timeout = 10_000) {
    await page.waitForFunction(
        ({ previous }) => {
            const hooks = (window as any).__BC_HOTSEAT_E2E__ as HotseatE2EApi | undefined;
            if (!hooks || typeof hooks.getStateID !== 'function') return false;
            const current = hooks.getStateID();
            if (current == null) return false;
            return current > (previous ?? -1);
        },
        { previous: before },
        { timeout }
    );
}

async function waitForPendingChoiceClear(page: any, api: any) {
    await expect.poll(async () => api.evaluate((h: HotseatE2EApi) => h.getPendingChoiceKind()), { timeout: 10_000 }).toBeNull();
}


async function clickUntilStateIDIncrease(page: any, api: any, tile: any, before: number | null) {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        await tile.click();
        try {
            await waitForStateIDIncrease(page, api, before, 3_500);
            return;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError ?? new Error('Expected stateID to increase after selectTile resolveChoice attempts.');
}

test('pendingChoice.selectOption is modal-driven and blocks board workflow', async ({ page }) => {
    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const api = await getHotseatApi(page);
    await ensureActiveSeat(page);

    await api.evaluate((h: HotseatE2EApi) => {
        h.setPendingChoice({ kind: 'selectOption', spec: { options: ['A', 'B'] }, player: '0' });
    });

    await expect(page.getByTestId('pending-choice-overlay')).toBeVisible();
    await expect(page.getByTestId('pending-choice-confirm')).toBeDisabled();

    await page.getByTestId('pending-choice-option-0').click();
    await expect(page.getByTestId('pending-choice-confirm')).toBeEnabled();
    await page.getByTestId('pending-choice-confirm').click();

    await expect(page.getByTestId('pending-choice-overlay')).toBeHidden();

    await waitForPendingChoiceClear(page, api);
});

test('pendingChoice.selectTile stays board-driven and does not render blocking modal', async ({ page }) => {
    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const api = await getHotseatApi(page);
    await ensureActiveSeat(page);

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

    await clickUntilStateIDIncrease(page, api, selectableTile, stateIDBefore);
    await waitForPendingChoiceClear(page, api);

    const stateIDAfter = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(stateIDAfter).toBeGreaterThan(stateIDBefore ?? -1);
});
