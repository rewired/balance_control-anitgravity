import { expect, test } from '@playwright/test';

test('hex overlays (selection and target) use cell variables for sizing and have hex clip-path', async ({ page }) => {
    await page.goto('/?mode=online');

    // Wait for the app to load (lobby-screen is a safe anchor)
    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    // Inject test elements
    await page.evaluate(() => {
        // Selection overlay test
        const sel = document.createElement('div');
        sel.className = 'hex-cell hex-cell-selected';
        sel.id = 'test-sel';
        sel.style.setProperty('--hex-cell-w', '120px');
        sel.style.setProperty('--hex-cell-h', '140px');
        document.body.appendChild(sel);

        // Target overlay test
        const tgt = document.createElement('div');
        tgt.className = 'hex-cell hex-cell-target';
        tgt.id = 'test-tgt';
        tgt.style.setProperty('--hex-cell-w', '110px');
        tgt.style.setProperty('--hex-cell-h', '130px');
        document.body.appendChild(tgt);

        // Destination overlay test
        const dest = document.createElement('div');
        dest.className = 'hex-cell hex-cell-target-destination';
        dest.id = 'test-dest';
        dest.style.setProperty('--hex-cell-w', '115px');
        dest.style.setProperty('--hex-cell-h', '135px');
        document.body.appendChild(dest);
    });

    const checkOverlay = async (id: string, expectedW: string, expectedH: string) => {
        const styles = await page.evaluate((selId) => {
            const el = document.getElementById(selId);
            if (!el) return null;
            const after = window.getComputedStyle(el, '::after');
            return {
                width: after.width,
                height: after.height,
                clipPath: after.clipPath,
                borderStyle: after.borderStyle,
                position: after.position
            };
        }, id);

        expect(styles).not.toBeNull();
        expect(styles!.width).toBe(expectedW);
        expect(styles!.height).toBe(expectedH);
        expect(styles!.clipPath).toContain('polygon');
        expect(styles!.borderStyle).toBe('dashed');
        expect(styles!.position).toBe('absolute');
    };

    await checkOverlay('test-sel', '120px', '140px');
    await checkOverlay('test-tgt', '110px', '130px');
    await checkOverlay('test-dest', '115px', '135px');
});
