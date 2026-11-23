import { expect, test } from '@playwright/test';

/** #107: Settings fits a phone at every text size, and Close stays on screen. */
for (const size of [0, 1, 2, 3]) {
  for (const locale of ['en', 'zh-Hant-TW']) {
    test(`Settings fits 390 px at text size ${size} in ${locale} (#107)`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      await page.addInitScript(
        ([s, l]) => localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ locale: l, textSize: s, contentNoteSeen: true })),
        [size, locale] as const,
      );
      await page.goto('./');
      await page.getByRole('button', { name: /^(Settings|設定)$/ }).click();
      const sheet = page.locator('.overlay__sheet');
      await expect(sheet).toBeVisible();
      const box = (await sheet.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      const close = (await page.locator('.overlay__close').boundingBox())!;
      expect(close.x + close.width).toBeLessThanOrEqual(390);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await context.close();
    });
  }
}
