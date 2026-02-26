/**
 * ARCH-06 contract coverage:
 * - No auto-commit for normal actions
 * - Commit only after explicit Confirm
 *
 * Contract: docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md
 */
import { expect, test } from '@playwright/test';

type HotseatE2EApi = {
    getStateID: () => number | null;
};

async function getHotseatApi(page: any): Promise<HotseatE2EApi> {
    await page.waitForFunction(() => Boolean((window as any).__BC_HOTSEAT_E2E__), undefined, {
        timeout: 10_000,
    });
    const hotseatApi = await page.evaluateHandle(() => (window as any).__BC_HOTSEAT_E2E__);
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

test('normal board action is draft-only (no auto-commit) and commits only after Confirm', async ({ page }) => {
    const api = await getHotseatApi(page);

    const initialStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(initialStateID).not.toBeNull();

    const firstGhost = page.locator('[data-testid^="hex-ghost-"]:not([disabled])').first();
    await expect(firstGhost).toBeVisible({ timeout: 15_000 });
    await firstGhost.click();

    const confirmButton = page.getByTestId('btn-confirm-draft');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    const afterDraftStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(afterDraftStateID).toBe(initialStateID);

    await confirmButton.click();

    await expect(confirmButton).toBeHidden();

    const afterConfirmStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(afterConfirmStateID).toBeGreaterThan(initialStateID ?? -1);
});
