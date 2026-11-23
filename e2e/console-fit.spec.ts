import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const target = targets().find((t) => t.name === 'puzzle-console')!;

/** #108: the console on a phone and by keyboard. */
for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`on a phone the console shows every line whole, and the command line has room (${locale}) (#108)`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await loadTarget(page, 'http://localhost:4173/dark-reaction/', target, { locale, reduceMotion: true, highContrast: false });
    // Typing straight away reaches the command line.
    await expect(page.locator('.con__input')).toBeFocused();
    await page.locator('.con__chip[data-command="queue --all"]').tap();
    await expect(page.locator('.con__log')).toContainText('PRIORITY');
    const cut = await page.locator('.con__line').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    expect(cut).toBe(0);
    expect((await page.locator('.con__input').boundingBox())!.width).toBeGreaterThan(200);
    await context.close();
  });
}

test('once solved, the way on is focused and says what you found (#108)', async ({ page }) => {
  await loadTarget(page, 'http://localhost:4173/dark-reaction/', target, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.keyboard.type('queue --all');
  await page.keyboard.press('Enter');
  await page.keyboard.type('info 13');
  await page.keyboard.press('Enter');
  await expect(page.locator('.con__finish')).toBeFocused();
  await expect(page.locator('.con__finish')).toHaveAccessibleDescription(/.+/);
});
