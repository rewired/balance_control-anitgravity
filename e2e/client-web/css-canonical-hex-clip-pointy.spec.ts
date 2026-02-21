import { expect, test } from '@playwright/test';

test('canonical hex clip-path is pointy-top', async ({ page }) => {
    await page.goto('/?mode=online');

    // Wait for the app to load (lobby-screen is a safe anchor)
    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    // Inject a dummy structure to test the CSS ghost rules
    await page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'hex-ghost';
        el.id = 'test-hex-ghost';
        // Set variables that the CSS expects
        el.style.setProperty('--hex-cell-w', '100px');
        el.style.setProperty('--hex-cell-h', '100px');
        document.body.appendChild(el);
    });

    const selector = '#test-hex-ghost';

    const styles = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const computed = window.getComputedStyle(el);
        return {
            clipPath: computed.clipPath
        };
    }, selector);

    expect(styles).not.toBeNull();

    // clip-path should contain 'polygon'
    expect(styles!.clipPath).toContain('polygon');

    // Pointy-top polygon starts with 50% 0% (canonical)
    // We check for characteristic points to ensure it's the new pointy-top.
    // The exact string might vary in normalization (whitespace), so we use substring checks.
    expect(styles!.clipPath).toContain('50% 0%');
    expect(styles!.clipPath).toContain('93% 25%');
    expect(styles!.clipPath).toContain('50% 100%');

    // Ensure it doesn't contain the old flat-top points
    expect(styles!.clipPath).not.toContain('25% 5%');
});
