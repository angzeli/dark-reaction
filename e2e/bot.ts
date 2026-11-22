import { expect, type Page } from '@playwright/test';
import type { RouteStep } from '../src/content/routes.ts';

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

/** Let the lights-out and any act card play out (an act card is dismissed with Enter, as a player would). */
export async function settle(page: Page): Promise<void> {
  for (let i = 0; i < 200; i++) {
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
    if (left <= 0 || (await ended(page)) || (await loopNow(page)) !== loop) return;
    await wait(page, left >= 10 ? 10 : left >= 5 ? 5 : 1);
  }
  throw new Error(`never reached minute ${minute}`);
}

/** Let the rest of the night run out, through 03:33 and whatever follows it. */
async function night(page: Page): Promise<void> {
  const loop = await loopNow(page);
  for (let i = 0; i < 20; i++) {
    if ((await ended(page)) || (await loopNow(page)) !== loop) return;
    const left = 46 - (await minuteNow(page));
    await wait(page, left >= 10 ? 10 : left >= 5 ? 5 : 1);
  }
  throw new Error('the night never ended');
}

const SOLVERS: Record<string, (page: Page) => Promise<void>> = {
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
  async console(page) {
    await page.locator('.con__chip[data-command="queue --all"]').click();
    await page.locator('.con__chip[data-command="info 13"]').click();
    await page.locator('.con__finish').click();
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

export async function play(page: Page, steps: readonly RouteStep[]): Promise<void> {
  for (const [i, step] of steps.entries()) {
    try {
      await settle(page);
      if ('do' in step) await pick(page, step.do);
      else if ('go' in step) await go(page, step.go);
      else if ('wait' in step) await wait(page, step.wait);
      else if ('until' in step) await waitUntil(page, step.until);
      else if ('night' in step) await night(page);
      else if ('solve' in step) {
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
