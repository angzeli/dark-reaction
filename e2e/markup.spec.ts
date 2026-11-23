import { expect, test, type Locator, type Page } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';
import { SOLVERS } from './bot.ts';

const base = 'http://localhost:4173/dark-reaction/';
const visible = (page: Page) => page.evaluate(() => document.querySelector('.pz')?.textContent ?? '');

/** #128: no puzzle ever shows its emphasis as *asterisks*, at any step of solving it, in either language. */
for (const locale of ['en', 'zh-Hant-TW'] as const) {
  for (const target of targets().filter((t) => t.name.startsWith('puzzle-'))) {
    const id = target.name.slice('puzzle-'.length);
    test(`${id} (${locale}) shows no asterisks while it's solved (#128)`, async ({ page }) => {
      await loadTarget(page, base, target, { locale, reduceMotion: true, highContrast: false });
      const seen: string[] = [];
      const press = async (loc: Locator) => {
        await loc.click();
        const text = await visible(page);
        if (text.includes('*')) seen.push(text.slice(Math.max(0, text.indexOf('*') - 40), text.indexOf('*') + 40));
      };
      await SOLVERS[id]!(page, press);
      expect(seen).toEqual([]);
    });
  }
}

/** #109: a screen reader hears the page as words: no asterisks, and what you carry. */
test('the page a screen reader hears has no asterisks, and is cleared once said (#109)', async ({ page }) => {
  const target = targets().find((t) => t.name === 'act1-office-0247')!;
  await loadTarget(page, base, target, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.locator('.choice[data-choice="office.monitor"]').click();
  const live = page.locator('.narrative [aria-live]');
  await expect(live).not.toHaveText('');
  expect(await live.textContent()).not.toContain('*');
  await expect(live).toHaveText('', { timeout: 6_000 });
});
