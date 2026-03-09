import { expect, test } from '@playwright/test';

test.setTimeout(90_000);

const VIEWPORT_POLL_TIMEOUT_MS = 10_000;
const VIEWPORT_RETRY_ATTEMPTS = 12;
const VIEWPORT_SCALE_THRESHOLD = 0.05;
const VIEWPORT_TRANSLATION_THRESHOLD = 20;

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

async function readViewportSnapshot(page: any) {
    return await page.evaluate(() => {
        const el = document.querySelector('[data-testid="board-viewport"]') as HTMLElement | null;
        if (!el) return null;
        const scale = Number(el.dataset.scale);
        const tx = Number(el.dataset.tx);
        const ty = Number(el.dataset.ty);
        const baselineScale = Number(el.dataset.baselineScale);
        const baselineTx = Number(el.dataset.baselineTx);
        const baselineTy = Number(el.dataset.baselineTy);

        return {
            scale: Number.isFinite(scale) ? scale : null,
            tx: Number.isFinite(tx) ? tx : null,
            ty: Number.isFinite(ty) ? ty : null,
            baselineScale: Number.isFinite(baselineScale) ? baselineScale : null,
            baselineTx: Number.isFinite(baselineTx) ? baselineTx : null,
            baselineTy: Number.isFinite(baselineTy) ? baselineTy : null,
        };
    });
}

async function waitForScaleDelta(
    page: any,
    baselineScale: number,
    opts: { direction: 'increase' | 'decrease'; threshold?: number; timeoutMs?: number },
) {
    const threshold = opts.threshold ?? VIEWPORT_SCALE_THRESHOLD;
    const timeoutMs = opts.timeoutMs ?? VIEWPORT_POLL_TIMEOUT_MS;
    const target = opts.direction === 'increase' ? threshold : -threshold;

    const poll = expect.poll(async () => {
        const snapshot = await readViewportSnapshot(page);
        if (!snapshot || snapshot.scale === null) return null;
        return snapshot.scale - baselineScale;
    }, {
        timeout: timeoutMs,
        message: `Expected viewport scale delta to ${opts.direction} from baseline=${baselineScale} (threshold=${threshold}).`,
    });

    if (opts.direction === 'increase') {
        await poll.toBeGreaterThan(target);
    } else {
        await poll.toBeLessThan(target);
    }
}

async function assertBaselineAttributesReady(page: any, timeoutMs = VIEWPORT_POLL_TIMEOUT_MS) {
    await expect
        .poll(
            async () => {
                const snapshot = await readViewportSnapshot(page);
                if (!snapshot) return null;
                const {
                    baselineScale,
                    baselineTx,
                    baselineTy,
                } = snapshot;
                if (baselineScale === null || baselineTx === null || baselineTy === null) return null;
                return snapshot;
            },
            {
                timeout: timeoutMs,
                message: 'Expected viewport baseline data attributes to be initialized.',
            },
        )
        .not.toBeNull();
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

async function assertScaleChanged(
    page: any,
    baselineScale: number,
    direction: 'increase' | 'decrease',
    opts: { threshold?: number; timeoutMs?: number } = {},
) {
    const threshold = opts.threshold ?? VIEWPORT_SCALE_THRESHOLD;
    const timeoutMs = opts.timeoutMs ?? VIEWPORT_POLL_TIMEOUT_MS;

    try {
        await waitForScaleDelta(page, baselineScale, { direction, threshold, timeoutMs });
    } catch (error) {
        const snapshot = await readViewportSnapshot(page);
        throw new Error(
            `Scale assertion failed (${direction}, baseline=${baselineScale}, threshold=${threshold}). `
            + `Snapshot=${JSON.stringify(snapshot)}. `
            + `Cause=${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

async function assertTranslationChanged(
    page: any,
    baseline: { tx: number; ty: number },
    opts: { threshold?: number; timeoutMs?: number } = {},
) {
    const threshold = opts.threshold ?? VIEWPORT_TRANSLATION_THRESHOLD;
    const timeoutMs = opts.timeoutMs ?? VIEWPORT_POLL_TIMEOUT_MS;
    try {
        await expect.poll(async () => {
            const snapshot = await readViewportSnapshot(page);
            if (!snapshot || snapshot.tx === null || snapshot.ty === null) return null;
            return Math.abs(snapshot.tx - baseline.tx) + Math.abs(snapshot.ty - baseline.ty);
        }, {
            timeout: timeoutMs,
            message: `Expected viewport translation to change from baseline tx=${baseline.tx}, ty=${baseline.ty}.`,
        }).toBeGreaterThan(threshold);
    } catch (error) {
        const snapshot = await readViewportSnapshot(page);
        throw new Error(
            `Translation assertion failed (baselineTx=${baseline.tx}, baselineTy=${baseline.ty}, threshold=${threshold}). `
            + `Snapshot=${JSON.stringify(snapshot)}. `
            + `Cause=${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

async function zoomWithRetry(
    page: any,
    opts: { deltaY: number; baselineScale: number; direction: 'increase' | 'decrease'; threshold?: number; attempts?: number },
) {
    const attempts = opts.attempts ?? VIEWPORT_RETRY_ATTEMPTS;
    const threshold = opts.threshold ?? VIEWPORT_SCALE_THRESHOLD;

    for (let i = 0; i < attempts; i++) {
        await page.mouse.wheel(0, opts.deltaY);

        try {
            await assertScaleChanged(page, opts.baselineScale, opts.direction, {
                threshold,
                timeoutMs: 350,
            });
            return;
        } catch {
            // Retry with another wheel event until threshold is reached.
        }
    }

    await assertScaleChanged(page, opts.baselineScale, opts.direction, {
        threshold,
        timeoutMs: VIEWPORT_POLL_TIMEOUT_MS,
    });
}

test('board viewport: load + fit/zoom/pan/reset', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto('/?mode=hotseat');

    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();

    const viewport = page.getByTestId('board-viewport');
    await expect(viewport).toBeVisible();

    await waitForViewportTransform(page);

    // Baseline: fit on load
    await page.getByTestId('btn-fit-to-board').click();
    await waitForViewportTransform(page);
    await waitForViewportBaseline(page);
    await assertBaselineAttributesReady(page);
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(20);
    const baseline = await readViewportTransform(page);
    expect(baseline).not.toBeNull();

    await viewport.hover();
    await zoomWithRetry(page, {
        deltaY: -250,
        baselineScale: baseline!.scale,
        direction: 'increase',
    });
    const baselineForZoomOut = await readViewportTransform(page);
    expect(baselineForZoomOut).not.toBeNull();

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
    await zoomWithRetry(page, {
        deltaY: 250,
        baselineScale: baselineForZoomOut!.scale,
        direction: 'decrease',
    });
    const zoomedOut = await readViewportTransform(page);
    expect(zoomedOut).not.toBeNull();
    expect(zoomedOut!.scale).toBeLessThan(baselineForZoomOut!.scale - 0.01);
    expect(zoomedOut!.scale).toBeGreaterThanOrEqual(0.25);

    await zoomWithRetry(page, {
        deltaY: -250,
        baselineScale: zoomedOut!.scale,
        direction: 'increase',
    });
    const zoomedIn = await readViewportTransform(page);
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
    await assertTranslationChanged(page, { tx: zoomedIn!.tx, ty: zoomedIn!.ty });

    await expect.poll(async () => await readViewportSnapshot(page), {
        timeout: VIEWPORT_POLL_TIMEOUT_MS,
        message: 'Expected viewport transform snapshot to remain readable after pan interaction.',
    }).not.toBeNull();

    // Fit-to-board returns to baseline framing.
    await page.getByTestId('btn-fit-to-board').click();
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(20);

    // Reset returns to the stored baseline.
    await page.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
    await zoomWithRetry(page, {
        deltaY: 300,
        baselineScale: baselineForZoomOut!.scale,
        direction: 'decrease',
    });
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeGreaterThan(0.05);
    await page.getByTestId('btn-reset-view').click();
    await expect
        .poll(async () => await readViewportDeltaToBaseline(page))
        .toBeLessThan(20);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
