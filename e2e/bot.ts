import { expect, type Page } from '@playwright/test';
import type { RouteStep } from '../src/content/routes.ts';
import { EN_LINE, ZH_LINE } from '../src/puzzles/cipher/logic.ts';
import { ANSWER as DOORLOG } from '../src/puzzles/doorlog/logic.ts';
import { ANSWER as FREEZER } from '../src/puzzles/freezer/logic.ts';

/**
 * The playthrough bot: plays the validator's route steps (src/content/
 * routes.ts) through the real UI. Choices are picked by their ids and
 * puzzles are solved through their controls' data attributes, so the same
 * steps play in either language.
 */

const LOOP_START = 2 * 60 + 47;

export const pick = (page: Page, id: string) => page.locator(`.choice[data-choice="${id}"]`).click();

export async function go(page: Page, to: string): Promise<void> {
  await pick(page, 'meta:travel');
  await pick(page, `go:${to}`);
}

/** The loop minute the HUD shows (02:47 is 0). */
export async function minuteNow(page: Page): Promise<number> {
  const [h, m] = ((await page.locator('.hud__clock').textContent()) ?? '02:47').split(':').map(Number);
  return (h! * 60 + m! - LOOP_START + 1440) % 1440;
}

async function loopNow(page: Page): Promise<number> {
  return Number(/\d+/.exec((await page.locator('.hud__loop').textContent()) ?? '')?.[0] ?? 0);
}

const ended = async (page: Page) => (await page.locator('article.ending').count()) > 0;
/** The night is over for the bot's purposes: an ending, or a puzzle opened by 03:33 itself (the dark run). */
const stopped = async (page: Page) => (await ended(page)) || (await page.locator('.pz').count()) > 0;

/**
 * What a playthrough wants to keep: a screenshot on arriving in each room,
 * of each puzzle as it opens, and of each lights-out (#24). `play` reports
 * to it while it runs.
 */
export interface Capture {
  room(location: string): Promise<void>;
  puzzle(id: string): Promise<void>;
  lightsOut(): Promise<void>;
}
let capture: Capture | null = null;

/** Let the lights-out and any act card play out (an act card is dismissed with Enter, as a player would). */
export async function settle(page: Page): Promise<void> {
  let dark = false;
  for (let i = 0; i < 200; i++) {
    // Shoot once it is fully dark, with the clock lit (the fade-in shows nothing yet).
    if (!dark && capture && (await page.locator('.dr-lightsout .dr-lightsout__clock--on').count())) {
      dark = true;
      await capture.lightsOut();
    }
    if (await page.locator('.act-card:not(.act-card--out)').count()) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      continue;
    }
    if (await page.locator('.dr-lightsout, .act-card').count()) {
      await page.waitForTimeout(100);
      continue;
    }
    if (await page.locator('.choice, article.ending, .pz').count()) return;
    await page.waitForTimeout(100);
  }
  throw new Error('the game never settled');
}

async function wait(page: Page, n: 1 | 5 | 10): Promise<void> {
  await pick(page, 'meta:wait');
  await pick(page, `wait:${n}`);
  await settle(page);
}

/** Wait in the hub until this loop minute; the night's events cut some waits short. */
export async function waitUntil(page: Page, minute: number): Promise<void> {
  const loop = await loopNow(page);
  for (let i = 0; i < 40; i++) {
    const left = minute - (await minuteNow(page));
    if (left <= 0 || (await stopped(page)) || (await loopNow(page)) !== loop) return;
    await wait(page, left >= 10 ? 10 : left >= 5 ? 5 : 1);
  }
  throw new Error(`never reached minute ${minute}`);
}

/** Let the rest of the night run out, through 03:33 and whatever follows it. */
async function night(page: Page): Promise<void> {
  const loop = await loopNow(page);
  for (let i = 0; i < 20; i++) {
    if ((await stopped(page)) || (await loopNow(page)) !== loop) return;
    const left = 46 - (await minuteNow(page));
    await wait(page, left >= 10 ? 10 : left >= 5 ? 5 : 1);
  }
  throw new Error('the night never ended');
}

export const SOLVERS: Record<string, (page: Page) => Promise<void>> = {
  async tlc(page) {
    await page.locator('.tlc__uv').click();
    for (const n of [12, 13, 14]) await page.locator(`.tlc__take[data-lane="${n}"]`).click();
    await page.locator('.tlc__combine').click();
  },
  async glovebox(page) {
    for (const m of ['outer', 'load', 'outer', 'evacuate', 'refill', 'evacuate', 'refill', 'evacuate', 'refill', 'inner', 'transfer', 'done']) {
      await page.locator(`.gb__btn[data-move="${m}"]`).click();
    }
  },
  async doorlog(page) {
    // Tonight's two windows, by keyboard: Home is 02:47, PageUp five minutes, ArrowRight one.
    const set = async (row: 'pi' | 'exit', start: number) => {
      await page.locator(`.dl__track[data-row="${row}"]`).focus();
      await page.keyboard.press('Home');
      for (let i = 0; i < Math.floor(start / 5); i++) await page.keyboard.press('PageUp');
      for (let i = 0; i < start % 5; i++) await page.keyboard.press('ArrowRight');
    };
    await set('pi', DOORLOG.pi);
    await set('exit', DOORLOG.exit);
    await page.locator('.dl__write').click();
  },
  async cipher(page) {
    // Her last page: in 繁中 strip each character's radical; in English fill each gap with its element.
    if (await page.locator('.ci--zh').count()) {
      for (const [i, c] of ZH_LINE.entries()) {
        await page.locator(`.ci__char[data-char="${i}"]`).click();
        await page.locator(`.ci__radical[data-radical="${c.radical}"]`).click();
      }
    } else {
      for (const z of EN_LINE) await page.locator(`.ci__el[data-z="${z}"]`).click();
    }
    await page.locator('.ci__finish').click();
  },
  async freezer(page) {
    await page.locator(`.fz__cell[data-cell="${FREEZER}"]`).click();
    await page.locator('.fz__lift').click();
    await page.locator('.fz__finish').click();
  },
  async console(page) {
    await page.locator('.con__chip[data-command="queue --all"]').click();
    await page.locator('.con__chip[data-command="info 13"]').click();
    await page.locator('.con__finish').click();
  },
  async schlenk(page) {
    await page.locator('.sk__n2').click();
    for (const [port, tap] of [[2, 'vac'], [2, 'n2'], [4, 'n2'], [2, 'closed']] as const) await page.locator(`.sk__tap[data-port="${port}"][data-tap="${tap}"]`).click();
    await page.locator('.sk__bleed[data-bleed="tube"]').click();
    await page.locator('.sk__jy').click();
    await page.locator('.sk__wrap').click();
    await page.locator('.sk__finish').click();
  },
  async chirp(page) {
    for (const key of ['2', '4', '1', '3', 'enter']) await page.locator(`.cp__key[data-key="${key}"]`).click();
    await page.locator('.cp__finish').click();
  },
  async fabrication(page) {
    await page.locator('.fb__overlay').click();
    for (const feature of ['noise', 'solvent', 'satellites']) await page.locator(`.fb__spot[data-feature="${feature}"]`).click();
    await page.locator('.fb__finish').click();
  },
  async peakmatch(page) {
    for (const by of [10, 10, 1, 1, 1]) await page.locator(`.pm__nudge[data-by="${by}"]`).click();
    await page.locator('.pm__peak[data-peak="product"]').click();
    await page.locator('.pm__finish').click();
  },
};

/** Strike a standing fudge through in the notebook, as a player would: find its page, strike, close. */
export async function strike(page: Page): Promise<void> {
  await page.keyboard.press('n');
  const notebook = page.locator('.overlay--notebook');
  await expect(notebook).toBeVisible();
  const tabs = notebook.locator('.nb__tab');
  for (let i = 0; i < (await tabs.count()); i++) {
    await tabs.nth(i).click();
    if (await notebook.locator('.nb__strike').count()) break;
  }
  await notebook.locator('.nb__strike').first().click();
  await expect(notebook.locator('.nb__entry--struck')).not.toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(notebook).toHaveCount(0);
}

export async function play(page: Page, steps: readonly RouteStep[], keep?: Capture): Promise<void> {
  capture = keep ?? null;
  try {
    await playSteps(page, steps);
  } finally {
    capture = null;
  }
}

async function playSteps(page: Page, steps: readonly RouteStep[]): Promise<void> {
  for (const [i, step] of steps.entries()) {
    try {
      await settle(page);
      if ('do' in step) await pick(page, step.do);
      else if ('go' in step) {
        await go(page, step.go);
        await settle(page);
        await capture?.room(step.go);
      }
      else if ('wait' in step) await wait(page, step.wait);
      else if ('until' in step) await waitUntil(page, step.until);
      else if ('night' in step) await night(page);
      else if ('solve' in step) {
        if (capture) {
          await expect(page.locator('.pz')).toBeVisible();
          await capture.puzzle(step.solve);
        }
        await SOLVERS[step.solve]!(page);
        await expect(page.locator('.pz')).toHaveCount(0);
      } else if ('fail' in step) await page.locator('.pz__leave').click();
      else if ('correct' in step) await strike(page);
    } catch (e) {
      throw new Error(`route step ${i} (${JSON.stringify(step)}): ${(e as Error).message}`, { cause: e });
    }
  }
  await settle(page);
}

/** A fresh night in this locale, past the content note and the Act I card. */
export async function newGame(page: Page, locale: 'en' | 'zh-Hant-TW', opts: { reducedMotion?: boolean } = {}): Promise<void> {
  if (opts.reducedMotion ?? true) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((l) => {
    if (!localStorage.getItem('dark-reaction.settings.v1')) localStorage.setItem('dark-reaction.settings.v1', JSON.stringify({ contentNoteSeen: true, locale: l }));
  }, locale);
  await page.goto('./');
  await page.locator('.title__btn--primary').click();
  await settle(page);
}
