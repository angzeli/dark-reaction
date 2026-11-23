import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const base = 'http://localhost:4173/dark-reaction/';
test.use({ viewport: { width: 390, height: 844 } });

/** #156: a filename has nowhere to break, and must not push a phone's page sideways. */
for (const name of ['scene-office-microsd', 'ending-dark']) {
  for (const locale of ['en', 'zh-Hant-TW'] as const) {
    for (const textSize of [1, 2, 3] as const) {
      test(`${name} (${locale}, text size ${textSize}) fits a 390 px screen (#156)`, async ({ page }) => {
        await loadTarget(page, base, targets().find((t) => t.name === name)!, { locale, reduceMotion: true, highContrast: false, textSize });
        await expect(page.locator('.narrative__text, .ending__text').first()).toContainText('PROTON_DARK');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
        const menu = page.locator('[data-focus-key="hud-menu"]');
        if (await menu.count()) expect((await menu.boundingBox())!.x + (await menu.boundingBox())!.width).toBeLessThanOrEqual(390);
      });
    }
  }
}

/** #NEW7: no lone character on the last line of a paragraph or a choice, where the browser can help. */
test('paragraphs and choices wrap “pretty” (#NEW7)', async ({ page }) => {
  await loadTarget(page, base, targets().find((t) => t.name === 'act3-office')!, { locale: 'zh-Hant-TW', reduceMotion: true, highContrast: false, textSize: 2 });
  for (const selector of ['.narrative__text p', '.choice__label']) {
    const style = await page.locator(selector).first().evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.getPropertyValue('text-wrap-style')} ${s.getPropertyValue('text-wrap')}`;
    });
    expect(style, selector).toContain('pretty');
  }
});
