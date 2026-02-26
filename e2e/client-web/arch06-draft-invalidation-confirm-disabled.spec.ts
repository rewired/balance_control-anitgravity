/**
 * ARCH-06 contract coverage:
 * - Draft invalidated after seat switch -> Confirm disabled
 * - Existing draft key is preserved if draft remains mounted
 * - No auto-commit on seat switch
 *
 * Contract: docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md
 */
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
    });

    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();
});

test('draft becomes illegal after seat switch and disables Confirm without auto-commit', async ({ page }) => {
    const firstGhost = page.locator('[data-testid^="hex-ghost-"]:not([disabled])').first();
    await expect(firstGhost).toBeVisible({ timeout: 15_000 });
    await firstGhost.click();

    const confirmButton = page.getByTestId('btn-confirm-draft');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    const draftKeyLocator = page.getByTestId('draft-key');
    await expect(draftKeyLocator).toHaveCount(1);
    const draftKeyBefore = (await draftKeyLocator.textContent())?.trim();
    expect(draftKeyBefore).toBeTruthy();

    const stateIdBeforeSwitch = await page.evaluate(() => {
        return (window as any).__BC_HOTSEAT_E2E__?.getStateID?.() ?? null;
    });

    await page.getByTestId('hotseat-switch-1').click();
    await expect(page.getByTestId('hotseat-status')).toContainText('Active seat P1');

    const confirmCountAfterSwitch = await confirmButton.count();
    if (confirmCountAfterSwitch > 0) {
        await expect(confirmButton).toBeDisabled();
    }

    const draftKeyCountAfterSwitch = await draftKeyLocator.count();
    if (draftKeyCountAfterSwitch > 0) {
        const draftKeyAfter = (await draftKeyLocator.textContent())?.trim();
        expect(draftKeyAfter).toBe(draftKeyBefore);
    }

    const stateIdAfterSwitch = await page.evaluate(() => {
        return (window as any).__BC_HOTSEAT_E2E__?.getStateID?.() ?? null;
    });
    expect(stateIdAfterSwitch).toBe(stateIdBeforeSwitch);
});
