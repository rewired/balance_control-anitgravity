import { expect, test } from '@playwright/test';

test('ghost button has zero padding to align with hex cells', async ({ page }) => {
    await page.goto('/?mode=online');

    // Wait for the app to load (lobby-screen is a safe anchor)
    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    // Inject ghost button to verify CSS rules applicability
    // We inject it into document.body to ensure it picks up global styles
    await page.evaluate(() => {
        const btn = document.createElement('button');
        // It must have both classes to hit the .hex-cell.hex-ghost reset
        btn.className = 'hex-cell hex-ghost';
        btn.id = 'test-ghost-btn';
        btn.innerText = 'Ghost';
        document.body.appendChild(btn);
    });

    const btn = page.locator('#test-ghost-btn');

    // Verify reset padding
    // Global button style has 8px 16px, so we want to ensure it's overwritten to 0px
    await expect(btn).toHaveCSS('padding-top', '0px');
    await expect(btn).toHaveCSS('padding-right', '0px');
    await expect(btn).toHaveCSS('padding-bottom', '0px');
    await expect(btn).toHaveCSS('padding-left', '0px');

    // Verify appearance reset (Safari/older Chrome prevention)
    await expect(btn).toHaveCSS('appearance', 'none');
});
