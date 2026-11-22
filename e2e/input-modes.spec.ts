import { expect, test, type Locator, type Page } from '@playwright/test';
import { build } from 'vite';
import { SOLVERS, type Press } from './bot.ts';

/**
 * #25: every puzzle can be finished by keyboard alone and by touch alone.
 *
 * Each puzzle is mounted on its own in the puzzle harness (src/puzzles/harness.ts)
 * and solved with the bot's own solution (e2e/bot.ts), pressing its controls in
 * one of two ways:
 * - keyboard: Tab until the control has focus, or until focus is inside its roving
 *   group (`data-roving`), then the arrow keys to it; then Enter. Nothing is clicked.
 * - touch: a tap, on a phone-sized touch screen.
 *
 * And every control a puzzle shows can be reached with Tab: either it is a Tab stop
 * itself, or it is in a roving group whose one Tab stop is.
 *
 * Two puzzles keep their own tests for one mode, because their solution moves
 * through state a generic walk shouldn't: the door log by touch (its slider takes
 * nudges, e2e/act2-puzzles.spec.ts) and the Kraken by keyboard (its taps change the
 * line as the arrows pass over them, e2e/act3-puzzles.spec.ts).
 */

let bundle = '';
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: false, lib: { entry: 'src/puzzles/harness.ts', name: 'DRPuzzle', formats: ['iife'], fileName: () => 'p.js' } },
  });
  for (const out of Array.isArray(result) ? result : [result]) {
    if ('output' in out) for (const chunk of out.output) if (chunk.type === 'chunk') bundle += chunk.code;
  }
});

type Locale = 'en' | 'zh-Hant-TW';
interface Case {
  puzzle: string;
  act: 1 | 2 | 3;
  minute: number;
  locale?: Locale;
  items?: string[];
  skip?: { keyboard?: string; touch?: string };
}
const CASES: Case[] = [
  { puzzle: 'tlc', act: 1, minute: 5 },
  { puzzle: 'glovebox', act: 1, minute: 10 },
  { puzzle: 'console', act: 1, minute: 20 },
  { puzzle: 'doorlog', act: 2, minute: 10, skip: { touch: 'e2e/act2-puzzles.spec.ts plays it by touch alone' } },
  { puzzle: 'cipher', act: 2, minute: 28 },
  { puzzle: 'cipher', act: 2, minute: 28, locale: 'zh-Hant-TW' },
  { puzzle: 'freezer', act: 2, minute: 10 },
  { puzzle: 'schlenk', act: 3, minute: 10, items: ['item.foil'], skip: { keyboard: 'e2e/act3-puzzles.spec.ts plays it by keyboard alone' } },
  { puzzle: 'chirp', act: 3, minute: 20 },
  { puzzle: 'fabrication', act: 3, minute: 38 },
  { puzzle: 'peakmatch', act: 3, minute: 46 },
];
const name = (c: Case) => `${c.puzzle}${c.locale === 'zh-Hant-TW' ? ' in 繁中' : ''}`;

type Log = { finished: Array<{ solved: boolean; minutes: number; failed?: boolean }> };
async function mount(page: Page, c: Case): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setContent(`<!doctype html><html lang="${c.locale ?? 'en-GB'}"><body><div id="host"></div></body></html>`);
  await page.addScriptTag({ content: bundle });
  await page.evaluate(
    ([c]) => {
      type H = { setup(m: number, h: number, o: unknown): { frame: unknown }; switchLocale(l: string, f: unknown): void };
      const w = window as unknown as { DRPuzzle: H; harness: { frame: unknown } };
      w.harness = w.DRPuzzle.setup(c.minute, 0, { puzzle: c.puzzle, act: c.act, items: c.items ?? [] });
      if (c.locale) w.DRPuzzle.switchLocale(c.locale, w.harness.frame);
    },
    [c] as const,
  );
  await expect(page.locator('.pz')).toBeVisible();
  return errors;
}
const finished = (page: Page) => page.evaluate(() => (window as unknown as { harness: { log: Log } }).harness.log.finished);

/** Where focus is, relative to a control: on it, inside its roving group, or elsewhere. */
async function relation(control: Locator): Promise<{ at: 'here' | 'group' | 'away'; dx: number; dy: number; linear: boolean }> {
  return control.evaluate((el) => {
    const a = document.activeElement as HTMLElement | null;
    const group = el.closest<HTMLElement>('[data-roving]');
    if (a === el) return { at: 'here' as const, dx: 0, dy: 0, linear: false };
    if (!a || !group || !group.contains(a)) return { at: 'away' as const, dx: 0, dy: 0, linear: false };
    const r = el.getBoundingClientRect();
    const f = a.getBoundingClientRect();
    return { at: 'group' as const, dx: r.left + r.width / 2 - (f.left + f.width / 2), dy: r.top + r.height / 2 - (f.top + f.height / 2), linear: group.dataset['roving'] === 'line' };
  });
}

/** Keyboard only: Tab to the control, or into its group and arrow to it; then Enter. */
const byKeyboard =
  (page: Page): Press =>
  async (control) => {
    await expect(control).toBeEnabled();
    for (let i = 0; i < 200; i++) {
      const r = await relation(control);
      if (r.at === 'here') return page.keyboard.press('Enter');
      if (r.at === 'away') await page.keyboard.press('Tab');
      else if (r.linear) await page.keyboard.press('ArrowRight');
      else if (Math.abs(r.dy) > 4) await page.keyboard.press(r.dy > 0 ? 'ArrowDown' : 'ArrowUp');
      else await page.keyboard.press(r.dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    }
    throw new Error(`could not reach ${control.toString()} by keyboard`);
  };

/** Touch only: a tap. */
const byTouch: Press = (control) => control.tap();

/** Tab through the page and check every control in the puzzle was a Tab stop, or in a group that had one. */
async function everyControlReachable(page: Page): Promise<string[]> {
  const seen = new Set<string>();
  const mark = () =>
    page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a || !a.closest('.pz')) return null;
      if (!a.dataset['seenId']) a.dataset['seenId'] = String(Math.random());
      return a.dataset['seenId'];
    });
  for (let i = 0; i < 250; i++) {
    await page.keyboard.press('Tab');
    const id = await mark();
    if (id) seen.add(id);
  }
  return page.evaluate((visited) => {
    const missed: string[] = [];
    const controls = [...document.querySelectorAll<HTMLElement>('.pz button, .pz [role="slider"], .pz [tabindex="0"]')].filter(
      (el) => !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
    );
    for (const el of controls) {
      const group = el.closest<HTMLElement>('[data-roving]');
      const ok = group ? [...group.querySelectorAll<HTMLElement>('[data-seen-id]')].some((m) => visited.includes(m.dataset['seenId']!)) : visited.includes(el.dataset['seenId'] ?? '');
      if (!ok) missed.push(`${el.className || el.tagName} "${(el.textContent ?? '').trim().slice(0, 30)}"`);
    }
    return missed;
  }, [...seen]);
}

test.describe('by keyboard alone', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  for (const c of CASES) {
    test(`${name(c)}: every control is a Tab stop or in a group that has one, and it can be finished with Tab, the arrows and Enter`, async ({ page }) => {
      test.skip(!!c.skip?.keyboard, c.skip?.keyboard);
      const errors = await mount(page, c);
      expect(await everyControlReachable(page)).toEqual([]);
      await SOLVERS[c.puzzle]!(page, byKeyboard(page));
      expect(await finished(page)).toEqual([expect.objectContaining({ solved: true })]);
      expect(errors).toEqual([]);
    });
  }
});

test('the walk notices a control taken out of the Tab order', async ({ page }) => {
  await mount(page, CASES[0]!);
  await page.locator('.tlc__combine').evaluate((el) => el.setAttribute('tabindex', '-1'));
  expect(await everyControlReachable(page)).toEqual([expect.stringContaining('tlc__combine')]);
});

test.describe('by touch alone', () => {
  test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });
  for (const c of CASES) {
    test(`${name(c)}: it can be finished by tapping alone, on a phone`, async ({ page }) => {
      test.skip(!!c.skip?.touch, c.skip?.touch);
      const errors = await mount(page, c);
      await SOLVERS[c.puzzle]!(page, byTouch);
      expect(await finished(page)).toEqual([expect.objectContaining({ solved: true })]);
      expect(errors).toEqual([]);
    });
  }
});
