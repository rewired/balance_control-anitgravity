import { expect, test } from '@playwright/test';

test('hex selection outline has hex clip-path, bloom filter, and dotted border', async ({ page }) => {
    await page.goto('/?mode=online');

    // Wait for the app to load (lobby-screen is a safe anchor)
    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    // Inject a dummy structure to test the CSS selection rules
    await page.evaluate(() => {
        const container = document.createElement('div');
        container.className = 'hex-cell hex-cell-selected';
        container.id = 'test-selection-hex';
        // Set variables that the CSS expects
        container.style.setProperty('--hex-cell-w', '100px');
        container.style.setProperty('--hex-cell-h', '100px');

        const inner = document.createElement('div');
        inner.className = 'hex-tile-visual';
        container.appendChild(inner);

        document.body.appendChild(container);
    });

    const selector = '#test-selection-hex';

    // Check pseudo-element styles
    const styles = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const after = window.getComputedStyle(el, '::after');
        return {
            clipPath: after.clipPath,
            filter: after.filter,
            borderStyle: after.borderStyle,
            width: after.width,
            height: after.height,
            zIndex: after.zIndex
        };
    }, selector);

    expect(styles).not.toBeNull();
    // clip-path should reference the outline clip (browser might return url(...) with absolute path)
    expect(styles!.clipPath).toContain('hex-outline-clip');

    // filter should not be 'none' (it should contain drop-shadow)
    expect(styles!.filter).not.toBe('none');
    expect(styles!.filter).toContain('drop-shadow');

    // border-style should be dashed (as updated)
    expect(styles!.borderStyle).toBe('dashed');

    // z-index should be 2 (as updated)
    expect(styles!.zIndex).toBe('2');
});
