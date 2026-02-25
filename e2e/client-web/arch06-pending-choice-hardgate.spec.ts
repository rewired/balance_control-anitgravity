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
    return await page.evaluateHandle(() => (window as any).__BC_HOTSEAT_E2E__ as HotseatE2EApi);
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

    const selectableTile = page.locator('[data-testid^="hex-tile-"]').first();
    await expect(selectableTile).toBeVisible();

    const selectableTileTestId = await selectableTile.getAttribute('data-testid');
    expect(selectableTileTestId).toBeTruthy();
    const coordToken = selectableTileTestId!.replace('hex-tile-', '');
    const coord = coordToken.replace('_', ',');

    const selectedTileId = await page.evaluate((coordValue) => {
        return (window as any).__BC_HOTSEAT_E2E_STATE__?.G?.grid?.[coordValue] ?? null;
    }, coord);
    expect(selectedTileId).toBeTruthy();

    await api.evaluate((h: HotseatE2EApi, tileId: string) => {
        h.setPendingChoice({ kind: 'selectTile', spec: { tileIds: [tileId] } });
    }, selectedTileId as string);

    await expect(page.getByTestId('pending-choice-overlay')).toHaveCount(0);

    await expect(selectableTile).toBeVisible();
    await selectableTile.click();

    const pendingKind = await api.evaluate((h: HotseatE2EApi) => h.getPendingChoiceKind());
    expect(pendingKind).toBeNull();

    const stateIDAfter = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(stateIDAfter).toBeGreaterThan(stateIDBefore ?? -1);
});
