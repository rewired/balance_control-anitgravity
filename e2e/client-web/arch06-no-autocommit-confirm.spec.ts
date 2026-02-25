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
    return await page.evaluateHandle(() => (window as any).__BC_HOTSEAT_E2E__);
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

    const firstGhost = page.getByTestId('hex-ghost-0_0').first();
    await expect(firstGhost).toBeVisible();
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
