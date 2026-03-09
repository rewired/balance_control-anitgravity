/**
 * ARCH-06 contract coverage:
 * - No auto-commit for normal actions
 * - Commit only after explicit Confirm
 *
 * Contract: docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md
 */
import { expect, test } from '@playwright/test';

type HotseatE2EApi = {
    getStateID: () => number | null;
};

async function getHotseatApi(page: any): Promise<HotseatE2EApi> {
    await page.waitForFunction(() => Boolean((window as any).__BC_HOTSEAT_E2E__), undefined, {
        timeout: 10_000,
    });
    const hotseatApi = await page.evaluateHandle(() => (window as any).__BC_HOTSEAT_E2E__);
    if ((await hotseatApi.evaluate((api: HotseatE2EApi | null) => api === null)) === true) {
        throw new Error('ARCH-06 E2E hook missing: window.__BC_HOTSEAT_E2E__ is null after wait timeout.');
    }
    return hotseatApi;
}

async function waitForBoardReady(page: any): Promise<void> {
    const hotseatStatus = page.getByTestId('hotseat-status');
    await expect(hotseatStatus).toBeVisible();

    let currentSeat: '0' | '1' | null = null;
    await expect
        .poll(async () => {
            const text = (await hotseatStatus.textContent()) ?? '';
            const match = text.match(/currentPlayer P([01])/);
            currentSeat = (match?.[1] as '0' | '1' | undefined) ?? null;
            return currentSeat;
        }, { timeout: 10_000, message: 'Waiting for a deterministic currentPlayer in hotseat status.' })
        .not.toBeNull();

    const targetSeatButton = page.getByTestId(`hotseat-switch-${currentSeat!}`);
    if (await targetSeatButton.isEnabled()) {
        await targetSeatButton.click();
    }
    await expect(hotseatStatus).toContainText(`Active seat P${currentSeat!}`);
    await expect(hotseatStatus).toContainText(`currentPlayer P${currentSeat!}`);
    await expect(page.getByTestId('btn-confirm-draft')).toHaveCount(0);
}

async function clickStableLegalGhostTarget(page: any): Promise<void> {
    const board = page.getByTestId('hex-board');
    const legalGhostTargets = board.locator('[data-testid^="hex-ghost-"]:not([disabled])');

    await expect
        .poll(async () => legalGhostTargets.count(), {
            timeout: 15_000,
            message: 'Waiting for legal ghost targets to be rendered and enabled.',
        })
        .toBeGreaterThan(0);

    const targetIds = await legalGhostTargets.evaluateAll((elements) =>
        elements
            .map((element) => element.getAttribute('data-testid'))
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );
    const stableTargetId = targetIds.sort()[0];

    expect(stableTargetId).toBeTruthy();

    const stableTarget = board.getByTestId(stableTargetId!);
    await expect(stableTarget).toBeVisible();
    await stableTarget.click();
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        (window as any).__BC_ENABLE_E2E_HOOKS__ = true;
    });

    await page.goto('/?mode=hotseat');
    await expect(page.getByTestId('hotseat-game-screen')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('hex-board')).toBeVisible();
});

test('normal board action is draft-only (no auto-commit) and commits only after Confirm', async ({ page }) => {
    const api = await getHotseatApi(page);
    await waitForBoardReady(page);

    const initialStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(initialStateID).not.toBeNull();

    await clickStableLegalGhostTarget(page);

    const confirmButton = page.getByTestId('btn-confirm-draft');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    const afterDraftStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(afterDraftStateID).toBe(initialStateID);

    await confirmButton.click();

    await expect(confirmButton).toBeHidden();

    const afterConfirmStateID = await api.evaluate((h: HotseatE2EApi) => h.getStateID());
    expect(afterConfirmStateID).toBeGreaterThan(initialStateID ?? -1);
});
