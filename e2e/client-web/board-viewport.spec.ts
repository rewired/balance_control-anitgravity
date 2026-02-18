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

async function waitForViewportBaseline(page: any) {
    await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="board-viewport"]') as HTMLElement | null;
        if (!el) return false;
        const scale = Number(el.dataset.baselineScale);
        const tx = Number(el.dataset.baselineTx);
        const ty = Number(el.dataset.baselineTy);
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

async function readViewportDeltaToBaseline(page: any) {
    return await page.evaluate(() => {
        const el = document.querySelector('[data-testid="board-viewport"]') as HTMLElement | null;
        if (!el) return null;
        const scale = Number(el.dataset.scale);
        const tx = Number(el.dataset.tx);
        const ty = Number(el.dataset.ty);
        const bScale = Number(el.dataset.baselineScale);
        const bTx = Number(el.dataset.baselineTx);
        const bTy = Number(el.dataset.baselineTy);
        if (
            !Number.isFinite(scale)
            || !Number.isFinite(tx)
            || !Number.isFinite(ty)
            || !Number.isFinite(bScale)
            || !Number.isFinite(bTx)
            || !Number.isFinite(bTy)
        ) return null;
        return Math.abs(tx - bTx) + Math.abs(ty - bTy) + Math.abs(scale - bScale);
    });
}

async function waitForViewportIdle(
    page: any,
    opts: { stableMs?: number; timeoutMs?: number; epsilon?: number } = {},
) {
    const stableMs = opts.stableMs ?? 250;
    const timeoutMs = opts.timeoutMs ?? 5_000;
    const epsilon = opts.epsilon ?? 0.05;

    const startMs = Date.now();
    let lastChangeMs = startMs;
    let last = await readViewportTransform(page);

    while (Date.now() - startMs < timeoutMs) {
        await page.waitForTimeout(50);
        const cur = await readViewportTransform(page);
        if (!cur || !last) {
            last = cur;
            lastChangeMs = Date.now();
            continue;
        }
        const delta = Math.abs(cur.tx - last.tx) + Math.abs(cur.ty - last.ty) + Math.abs(cur.scale - last.scale);
        if (delta > epsilon) {
            last = cur;
            lastChangeMs = Date.now();
            continue;
        }
        if (Date.now() - lastChangeMs >= stableMs) {
            return;
        }
    }
    throw new Error('viewport did not become idle');
}

test('board viewport: load + fit/zoom/pan/reset', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto('/?mode=online');

    await expect(page.getByTestId('lobby-screen')).toBeVisible();

    await page.getByTestId('lobby-player-name').fill('E2E');
    const createResponse = page.waitForResponse((resp) => {
        return resp.request().method() === 'POST' && /\/games\/[^/]+\/create$/.test(resp.url());
    });
    await page.getByTestId('lobby-create-match').click();
    const createdMatch = await createResponse;
    const createdMatchJson = (await createdMatch.json().catch(() => null)) as { matchID?: string } | null;
    const matchID = createdMatchJson?.matchID;
    expect(matchID).toBeTruthy();

    const joinButton = page.getByTestId(`lobby-join-${matchID}-0`);
    await expect(joinButton).toBeVisible({ timeout: 15_000 });
    await joinButton.click();

    await expect(page.getByTestId('game-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const viewport = page.getByTestId('board-viewport');
    await expect(viewport).toBeVisible();

    await waitForViewportTransform(page);

    // Baseline: fit on load
    await page.getByTestId('btn-fit-to-board').click();
    await waitForViewportTransform(page);
    await waitForViewportBaseline(page);
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(1);
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
    let zoomedOut: { scale: number; tx: number; ty: number } | null = null;
    for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 250);
        await page.waitForTimeout(50);
        zoomedOut = await readViewportTransform(page);
        if (zoomedOut && zoomedOut.scale < baseline!.scale - 0.01) break;
    }
    expect(zoomedOut).not.toBeNull();
    expect(zoomedOut!.scale).toBeLessThan(baseline!.scale - 0.01);
    expect(zoomedOut!.scale).toBeGreaterThanOrEqual(0.25);

    await page.waitForTimeout(150);
    let zoomedIn: { scale: number; tx: number; ty: number } | null = null;
    for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, -250);
        await page.waitForTimeout(50);
        zoomedIn = await readViewportTransform(page);
        if (zoomedIn && zoomedIn.scale > zoomedOut!.scale + 0.01) break;
    }
    expect(zoomedIn).not.toBeNull();
    expect(zoomedIn!.scale).toBeGreaterThan(zoomedOut!.scale + 0.01);
    expect(zoomedIn!.scale).toBeLessThanOrEqual(2.5);

    // Drag pan changes translation.
    await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(viewportBox.x + viewportBox.width / 2 + 240, viewportBox.y + viewportBox.height / 2 + 160, {
        steps: 10,
    });
    await page.mouse.up();
    let panned: { scale: number; tx: number; ty: number } | null = null;
    await expect
        .poll(async () => {
            panned = await readViewportTransform(page);
            if (!panned) return null;
            return Math.abs(panned.tx - zoomedIn!.tx) + Math.abs(panned.ty - zoomedIn!.ty);
        })
        .toBeGreaterThan(1);
    await waitForViewportIdle(page, { stableMs: 400 });

    // Fit-to-board returns to baseline framing.
    await page.getByTestId('btn-fit-to-board').click();
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(1);
    await waitForViewportIdle(page);

    // Reset returns to the stored baseline.
    await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
    for (let i = 0; i < 2; i++) {
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(50);
    }
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeGreaterThan(0.05);
    await waitForViewportIdle(page);
    await page.getByTestId('btn-reset-view').click();
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(1);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
