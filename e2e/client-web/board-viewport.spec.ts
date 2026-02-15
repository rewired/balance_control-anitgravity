import { expect, test } from '@playwright/test';

async function waitForViewportTransform(page: any) {
    await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="board-viewport"]') as HTMLElement | null;
        if (!el) return false;
        const scale = Number(el.dataset.scale);
        const tx = Number(el.dataset.tx);
        const ty = Number(el.dataset.ty);
        return Number.isFinite(scale) && Number.isFinite(tx) && Number.isFinite(ty);
    });
}

async function readViewportTransform(page: any) {
    return await page.evaluate(() => {
        const el = document.querySelector('[data-testid="board-viewport"]') as HTMLElement | null;
        if (!el) return null;
        const scale = Number(el.dataset.scale);
        const tx = Number(el.dataset.tx);
        const ty = Number(el.dataset.ty);
        if (!Number.isFinite(scale) || !Number.isFinite(tx) || !Number.isFinite(ty)) return null;
        return { scale, tx, ty };
    });
}

test('board viewport: load + fit/zoom/pan/reset', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto('/');

    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    await page.getByTestId('lobby-player-name').fill('E2E');
    await page.getByTestId('lobby-create-match').click();

    const joinButton = page.locator('[data-testid^="lobby-join-"]').first();
    await expect(joinButton).toBeVisible({ timeout: 15_000 });
    await joinButton.click();

    await expect(page.getByTestId('game-screen')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const viewport = page.getByTestId('board-viewport');
    await expect(viewport).toBeVisible();

    await waitForViewportTransform(page);

    // Baseline: fit on load
    await page.getByTestId('btn-fit-to-board').click();
    await waitForViewportTransform(page);
    const baseline = await readViewportTransform(page);
    expect(baseline).not.toBeNull();

    // Board is framed inside the viewport (avoid pixel-perfect assertions).
    const viewportBox = await viewport.boundingBox();
    const boardBox = await page.getByTestId('hex-board').boundingBox();
    expect(viewportBox).not.toBeNull();
    expect(boardBox).not.toBeNull();
    if (!viewportBox || !boardBox) throw new Error('missing bounding boxes');
    const viewportLeft = viewportBox.x;
    const viewportTop = viewportBox.y;
    const viewportRight = viewportBox.x + viewportBox.width;
    const viewportBottom = viewportBox.y + viewportBox.height;
    const boardLeft = boardBox.x;
    const boardTop = boardBox.y;
    const boardRight = boardBox.x + boardBox.width;
    const boardBottom = boardBox.y + boardBox.height;
    const overlapW = Math.max(0, Math.min(boardRight, viewportRight) - Math.max(boardLeft, viewportLeft));
    const overlapH = Math.max(0, Math.min(boardBottom, viewportBottom) - Math.max(boardTop, viewportTop));
    expect(overlapW).toBeGreaterThan(0);
    expect(overlapH).toBeGreaterThan(0);
    const boardCx = boardLeft + boardBox.width / 2;
    const boardCy = boardTop + boardBox.height / 2;
    expect(boardCx).toBeGreaterThanOrEqual(viewportLeft);
    expect(boardCx).toBeLessThanOrEqual(viewportRight);
    expect(boardCy).toBeGreaterThanOrEqual(viewportTop);
    expect(boardCy).toBeLessThanOrEqual(viewportBottom);

    // Wheel zoom out then in (assert transform deltas, not pixels).
    await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
    for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, 250);
        await page.waitForTimeout(50);
    }
    let zoomedOut: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            zoomedOut = await readViewportTransform(page);
            return zoomedOut?.scale ?? null;
        })
        .toBeLessThan(baseline!.scale - 0.001);
    expect(zoomedOut!.scale).toBeGreaterThanOrEqual(0.25);

    await page.waitForTimeout(150);
    for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, -250);
        await page.waitForTimeout(50);
    }
    let zoomedIn: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            zoomedIn = await readViewportTransform(page);
            return zoomedIn?.scale ?? null;
        })
        .toBeGreaterThan(zoomedOut!.scale + 0.001);
    expect(zoomedIn!.scale).toBeLessThanOrEqual(2.5);

    // Drag pan changes translation.
    await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(viewportBox.x + viewportBox.width / 2 + 120, viewportBox.y + viewportBox.height / 2 + 80);
    await page.mouse.up();
    let panned: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            panned = await readViewportTransform(page);
            if (!panned) return null;
            return Math.abs(panned.tx - zoomedIn!.tx) + Math.abs(panned.ty - zoomedIn!.ty);
        })
        .toBeGreaterThan(5);

    // Fit-to-board returns to baseline framing.
    await page.getByTestId('btn-fit-to-board').click();
    let fitAgain: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            fitAgain = await readViewportTransform(page);
            if (!fitAgain) return null;
            return (
                Math.abs(fitAgain.tx - baseline!.tx)
                + Math.abs(fitAgain.ty - baseline!.ty)
                + Math.abs(fitAgain.scale - baseline!.scale)
            );
        })
        .toBeLessThan(1);

    // Reset returns to the stored baseline.
    await page.mouse.wheel(0, 600);
    await page.getByTestId('btn-reset-view').click();
    let reset: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            reset = await readViewportTransform(page);
            if (!reset) return null;
            return (
                Math.abs(reset.tx - baseline!.tx)
                + Math.abs(reset.ty - baseline!.ty)
                + Math.abs(reset.scale - baseline!.scale)
            );
        })
        .toBeLessThan(1);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
