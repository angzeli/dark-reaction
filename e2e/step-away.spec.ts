import { expect, test, type Locator } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';
import { SOLVERS } from './bot.ts';

const base = 'http://localhost:4173/dark-reaction/';

/** Each puzzle's own last button, shown once it's solved (write it down, close the box, …). */
const LAST: Record<string, string> = {
  glovebox: '.gb__btn[data-move="done"]',
  console: '.con__finish',
  cipher: '.ci__finish',
  freezer: '.fz__finish',
  schlenk: '.sk__finish',
  chirp: '.cp__finish',
  fabrication: '.fb__finish',
  peakmatch: '.pm__finish',
};

/** #140: a player who solves a puzzle and then steps away keeps the solve (the UPS stays armed). */
for (const [id, last] of Object.entries(LAST)) {
  test(`${id}: solved, then left before its last button, it stays solved (#140)`, async ({ page }) => {
    await loadTarget(page, base, targets().find((t) => t.name === `puzzle-${id}`)!, { locale: 'en', reduceMotion: true, highContrast: false });
    const press = async (control: Locator) => {
      if (!(await control.evaluate((el, selector) => el.matches(selector), last))) await control.click();
    };
    await SOLVERS[id]!(page, press);
    await expect(page.locator(last)).toBeVisible();
    await page.locator('.pz__leave').click();
    await expect(page.locator('.pz')).toHaveCount(0);
    const solved = await page.evaluate(() => (window as unknown as { darkReaction: { game: { state: { solved: string[] } } } }).darkReaction.game.state.solved);
    expect(solved).toContain(id);
  });
}
