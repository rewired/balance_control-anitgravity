/**
 * ARCH-06 contract coverage:
 * - Draft invalidated -> Confirm disabled
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

test('draft becomes illegal after seat switch and disables Confirm', async ({ page }) => {
    const firstGhost = page.getByTestId('hex-ghost-0_0').first();
    await expect(firstGhost).toBeVisible();
    await firstGhost.click();

    const confirmButton = page.getByTestId('btn-confirm-draft');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    await page.getByTestId('hotseat-switch-1').click();
    await expect(page.getByTestId('hotseat-status')).toContainText('Active seat P1');

    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeDisabled();
});
