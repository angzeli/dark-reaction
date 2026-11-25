import { expect, test, type Page } from '@playwright/test';
import { newGame, pick, play } from './bot.ts';

/**
 * The console answers to more than help admits (docs/HUMOUR.md §5, #205): `shuttle` at the B12 console,
 * in both languages, is answered and saved as an anomaly found; `help` doesn't mention it.
 */

test.use({ viewport: { width: 1280, height: 900 } });

const saved = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('dark-reaction.save.auto') ?? '{}') as { state?: { anomalies?: string[] } }).state?.anomalies ?? []);

async function type(page: Page, command: string) {
  const input = page.locator('.con__input');
  await input.fill(command);
  await input.press('Enter');
}

for (const [locale, answer] of [
  ['en', 'Last service: 18:15. It is'],
  ['zh-Hant-TW', '末班車：18:15。現在是'],
] as const) {
  test(`${locale}: shuttle, at the console`, async ({ page }) => {
    test.setTimeout(60_000);
    await newGame(page, locale);
    await play(page, [{ go: 'nmr' }]);
    await pick(page, 'nmr.console');
    const log = page.locator('.con__log');
    await type(page, 'help');
    await expect(log).not.toContainText('shuttle ');
    await type(page, 'shuttle');
    await expect(log).toContainText(answer);
    await expect.poll(() => saved(page)).toContain('cmd.shuttle');
    await type(page, 'xyzzy');
    await expect.poll(() => saved(page)).toContain('cmd.xyzzy');
  });
}
