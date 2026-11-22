import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ROUTES } from '../src/content/routes.ts';
import { go, newGame, pick, play } from './bot.ts';

/**
 * #25: axe on every kind of screen, in both languages, with zero serious or
 * critical violations: the title and its overlays, the play screen and its
 * overlays, the Act I and II puzzles, and an ending, in normal and high
 * contrast. (Act III's puzzles join when #21 lands.)
 */

test.use({ viewport: { width: 1280, height: 900 } });

async function scan(page: Page, where: string): Promise<void> {
  const result = await new AxeBuilder({ page }).analyze();
  const bad = result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ') + ' — ' + (n.failureSummary ?? '').split('\n').slice(1, 2).join('')).slice(0, 4).join('\n    ')}`);
  expect(bad, `${where}:\n  ${bad.join('\n  ')}`).toEqual([]);
}

async function overlay(page: Page, open: () => Promise<void>, where: string) {
  await open();
  await expect(page.getByRole('dialog')).toBeVisible();
  await scan(page, where);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Open a puzzle, scan it, and step away (or solve it, when later puzzles need it). */
async function puzzle(page: Page, where: string, then: 'leave' | 'solve', solve?: string) {
  await expect(page.locator('.pz')).toBeVisible();
  await scan(page, where);
  if (then === 'leave') await page.locator('.pz__leave').click();
  else await play(page, [{ solve: solve! }]);
  await expect(page.locator('.pz')).toHaveCount(0);
}

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  test(`${locale}: the title, the play screen, their overlays, and six puzzles`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((l) => {
      if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l }));
    }, locale);
    await page.goto('./');
    await scan(page, 'title');
    await overlay(page, () => page.locator('.title__btn[data-focus-key="title-settings"]').click(), 'settings');
    await overlay(page, () => page.locator('.title__btn[data-focus-key="title-gallery"]').click(), 'gallery');

    await newGame(page, locale);
    await scan(page, 'play: the office at 02:47');
    await overlay(page, () => page.keyboard.press('n'), 'notebook');
    await overlay(page, () => page.keyboard.press('m'), 'menu');
    await overlay(
      page,
      async () => {
        await page.keyboard.press('m');
        await page.getByRole('dialog').getByRole('button', { name: locale === 'en' ? 'Content note' : '內容提醒' }).click();
      },
      'content note',
    );

    // Act I's three puzzles, solved in turn so each opens the next.
    await go(page, 'synth');
    await pick(page, 'synth.plate');
    await puzzle(page, 'puzzle: TLC', 'solve', 'tlc');
    await play(page, [{ do: 'synth.rotavap' }, { do: 'synth.yield.honest' }, { go: 'glovebox' }, { do: 'glovebox.antechamber' }]);
    await puzzle(page, 'puzzle: antechamber', 'solve', 'glovebox');
    await play(page, [{ go: 'nmr' }, { do: 'nmr.console' }]);
    await puzzle(page, 'puzzle: console', 'solve', 'console');

    // Dan's office opens at 03:15 on any night: her notebook. Then the porter's terminal.
    await play(page, [{ go: 'stairs' }, { until: 27 }, { go: 'pi' }, { do: 'pi.notebook' }]);
    await puzzle(page, 'puzzle: cipher', 'leave');
    await play(page, [{ go: 'stairs' }, { do: 'stairs.terminal' }]);
    await puzzle(page, 'puzzle: door log', 'leave');
  });

  test(`${locale}: an ending, and the play screen in high contrast`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((l) => {
      if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l, highContrast: true }));
    }, locale);
    await page.goto('./');
    await page.locator('.title__btn--primary').click();
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
    await play(page, []);
    await scan(page, 'play, high contrast');
    await overlay(page, () => page.keyboard.press('n'), 'notebook, high contrast');
    await play(page, ROUTES.clocking!.steps);
    await expect(page.locator('article.ending')).toBeVisible();
    await scan(page, 'ending, high contrast');
  });
}

test('en: the freezer, once her notebook is read', async ({ page }) => {
  test.setTimeout(150_000);
  await newGame(page, 'en');
  await play(page, [{ go: 'stairs' }, { until: 27 }, { go: 'pi' }, { do: 'pi.notebook' }]);
  for (const z of [88, 74, 49, 88, 6, 19, 8, 10]) await page.locator(`.ci__el[data-z="${z}"]`).click();
  await page.locator('.ci__finish').click();
  await expect(page.locator('.pz')).toHaveCount(0);
  await play(page, [{ go: 'cold' }, { do: 'cold.rack1' }]);
  await puzzle(page, 'puzzle: freezer', 'leave');
});
