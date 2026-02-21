import { expect, test } from '@playwright/test';

test('board viewport overflow is hidden', async ({ page }) => {
    await page.goto('/?mode=online');

    // Wait for the app to load (lobby-screen is a safe anchor)
    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    // Inject test elements to verify CSS rules applicability
    await page.evaluate(() => {
        const vp = document.createElement('div');
        vp.className = 'board-viewport';
        vp.id = 'test-vp';
        document.body.appendChild(vp);

        const vpw = document.createElement('div');
        vpw.className = 'board-viewport-wrapper';
        vpw.id = 'test-vpw';
        document.body.appendChild(vpw);
    });

    const vp = page.locator('#test-vp');
    const vpw = page.locator('#test-vpw');

    await expect(vp).toHaveCSS('overflow', 'hidden');
    await expect(vpw).toHaveCSS('overflow', 'hidden');
});
