import { expect, test, type Page } from '@playwright/test';
import { CONTENT } from '../src/content/index.ts';
import { ROUTES } from '../src/content/routes.ts';
import { simulate } from '../src/engine/simulate.ts';
import type { EndingId } from '../src/engine/types.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import { newGame, play, type Capture } from './bot.ts';

/**
 * The playthrough bot (#24): every ending's route, exactly as the
 * validator plays it (src/content/routes.ts), driven through the real UI in
 * English and in 繁中: twelve runs, each from a new game to its ending
 * screen, with no console errors and no request outside the page's origin.
 *
 * Screenshots go to e2e/screenshots/playthrough/<locale>/<ending>/ (kept by
 * CI as an artifact): every ending screen, and on the true ending's route,
 * which visits every room and every puzzle, each room on arrival, each
 * puzzle as it opens and each lights-out.
 */

const ENDINGS: readonly EndingId[] = ['perfect', 'honest', 'clocking', 'infinite', 'fire', 'dark'];
const DIR = 'e2e/screenshots/playthrough';

test.use({ viewport: { width: 1280, height: 900 } });

function keeper(page: Page, dir: string): Capture & { shot(name: string, fullPage?: boolean): Promise<void> } {
  const seen = new Set<string>();
  let n = 0;
  let nights = 0;
  const shot = async (name: string, fullPage = false) => {
    if (seen.has(name)) return;
    seen.add(name);
    n += 1;
    await page.screenshot({ path: `${dir}/${String(n).padStart(2, '0')}-${name}.png`, fullPage });
  };
  return {
    shot,
    room: (location) => shot(`room-${location}`),
    puzzle: (id) => shot(`puzzle-${id}`),
    lightsOut: () => shot(`lightsout-${++nights}`),
  };
}

for (const locale of ['en', 'zh-Hant-TW'] as const) {
  for (const ending of ENDINGS) {
    test(`${ending}, in ${locale}: from a new game to the ending, through the real UI`, async ({ page, baseURL }) => {
      test.setTimeout(ending === 'dark' ? 300_000 : 150_000);
      const errors: string[] = [];
      const outside: string[] = [];
      const origin = new URL(baseURL ?? 'http://localhost').origin;
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.protocol.startsWith('http') && url.origin !== origin) outside.push(req.url());
      });

      const keep = keeper(page, `${DIR}/${locale}/${ending}`);
      await newGame(page, locale);
      // Only the true ending's route needs the rooms, puzzles and nights: it has all of them.
      await play(page, ROUTES[ending]!.steps, ending === 'dark' ? keep : undefined);

      await expect(page.locator(`article.ending[data-ending="${ending}"]`)).toBeVisible();
      await expect(page.locator('.ending__text > *').first()).toBeVisible();
      // The UI kept the validator's time exactly: the ending came in the same loop as the simulator's.
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dark-reaction.save.auto') ?? 'null') as { state: { loop: number } } | null);
      expect(saved?.state.loop, 'loop of the ending').toBe(simulate(CONTENT, PUZZLE_LOGIC, ROUTES[ending]!).game.state.loop);
      await keep.shot(`ending-${ending}`, true);
      expect(errors).toEqual([]);
      expect(outside).toEqual([]);
    });
  }
}
