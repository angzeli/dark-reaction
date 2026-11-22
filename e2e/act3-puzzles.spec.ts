import { expect, test, type Locator, type Page } from '@playwright/test';
import { build } from 'vite';
import { clockLabel } from '../src/engine/clock.ts';
import { inTheDark, kraken, resume, spectra, ups } from './act3.ts';
import { SOLVERS } from './bot.ts';

/**
 * Act III's puzzles through the real game: the Kraken by keyboard (and, in
 * 繁中 on a phone, by touch, without foil), the UPS chirp with the sound off
 * (steady segments, and a flashing LED where flicker is allowed), and the
 * three spectra on a desk and on a phone. The night is prepared in the
 * engine, as a player would have left it, and continued from the title
 * (e2e/act3.ts). Nothing in the rooms opens the peak match (the dark run
 * will), so a save puts it open at 03:33 as the dark run will; its
 * referencing, a language switch, the Kraken's foil read from what you
 * carry, the LED's modes and the bot's four solvers run in the puzzle
 * harness.
 */

test.use({ viewport: { width: 1280, height: 900 } });

async function open(page: Page, choice: string, how: 'click' | 'tap' = 'click'): Promise<{ d: Locator; at: (n: number) => string }> {
  await page.locator(`.choice[data-choice="${choice}"]`)[how]();
  const d = page.locator('.pz');
  await expect(d).toBeVisible();
  const [hh, mm] = ((await d.locator('.pz__clock-time').textContent()) ?? '').split(':').map(Number);
  const start = hh! * 60 + mm! - (2 * 60 + 47);
  return { d, at: (n: number) => clockLabel(start + n) };
}

const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// ── P5 · The Kraken ────────────────────────────────────────────────────────

test('the Kraken by keyboard: a suck-back puts everything back, then her tube is purged, filled, sealed and wrapped', async ({ page }) => {
  await resume(page, kraken('en', true), 'en');
  await expect(page.locator('.narrative__carry')).toContainText('foil');
  const { d, at } = await open(page, 'synth.kraken.fill');
  await expect(page.getByRole('dialog', { name: 'The Kraken' })).toBeVisible();
  await expect(d.locator('.sk__rules li')).toHaveCount(5);
  const status = d.locator('.sk__status');
  const tube = d.locator('.sk__tube');
  const taps = (n: number) => d.getByRole('radiogroup', { name: `Port ${n} tap` });
  await expect(tube).toHaveText('Her tube: empty, full of the room’s air.');

  // Rule 1, broken: vacuum on port 2 with the bubbler still. A suck-back, and two minutes gone.
  await taps(2).getByRole('radio', { name: 'Closed' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(status).toContainText('A suck-back.');
  await expect(taps(2).getByRole('radio', { name: 'Closed' })).toHaveAttribute('aria-checked', 'true');
  await expect(taps(2).getByRole('radio', { name: 'Closed' })).toBeFocused();
  await expect(d.locator('.pz__clock-time')).toHaveText(at(2));

  // Nitrogen on: the bubbler bubbles.
  const main = d.getByRole('button', { name: 'Nitrogen main: off' });
  await main.focus();
  await page.keyboard.press('Enter');
  await expect(d.getByRole('button', { name: 'Nitrogen main: on' })).toBeFocused();
  await expect(d.locator('.sk__bubbler')).toHaveText('The bubbler is bubbling.');
  await expect(d.locator('.sk__diagram')).toHaveAttribute('data-n2', 'true');

  // Port 2 down to vacuum and back up to nitrogen; each tap is one Tab stop, and the arrows turn it.
  await taps(2).getByRole('radio', { name: 'Closed' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tube).toHaveText('Her tube: pumped down to nothing.');
  await page.keyboard.press('Home');
  await expect(taps(2).getByRole('radio', { name: 'Nitrogen' })).toHaveAttribute('aria-checked', 'true');
  await expect(tube).toHaveText('Her tube: empty, full of nitrogen.');
  await expect(taps(2).locator('[tabindex="0"]')).toHaveCount(1);

  // Her flask under nitrogen; her tube closed with its bleed open, and the liquid crosses.
  await taps(4).getByRole('radio', { name: 'Closed' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(taps(4).getByRole('radio', { name: 'Nitrogen' })).toHaveAttribute('aria-checked', 'true');
  await taps(2).getByRole('radio', { name: 'Nitrogen' }).focus();
  await page.keyboard.press('ArrowRight');
  await d.getByRole('group', { name: 'Port 2 · her J. Young tube' }).getByRole('button', { name: 'Bleed: shut' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Dark liquid creeps along the cannula');
  await expect(tube).toHaveText('Her tube: holding the dark liquid, its tap open.');

  // Her tap shut, then foil.
  await d.getByRole('button', { name: 'Tube’s tap: open' }).focus();
  await page.keyboard.press('Enter');
  await expect(tube).toHaveText('Her tube: holding the dark liquid, its tap shut.');
  await d.getByRole('button', { name: 'Wrap her tube in foil' }).focus();
  await page.keyboard.press('Enter');
  await expect(tube).toHaveText('Her tube: sealed and wrapped in foil.');
  await expect(d.locator('.pz__clock-time')).toHaveText(at(2 + 6));
  await expect(d.getByRole('button', { name: 'Take her tube' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.pz')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('lies in your palm like something asleep');
  await expect(page.locator('.narrative__carry')).toContainText('her J. Young tube, filled and wrapped in foil');
  await expect(page.locator('.choice[data-choice="synth.kraken.fill"]')).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });

  test('the Kraken in 繁中, by touch alone, without foil: the light wins, and her tube is gone for the night', async ({ page }) => {
    await resume(page, kraken('zh-Hant-TW', false), 'zh-Hant-TW');
    const { d } = await open(page, 'synth.kraken.fill', 'tap');
    await expect(page.getByRole('dialog', { name: 'Kraken' })).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
    await d.locator('.sk__n2').tap();
    await expect(d.locator('.sk__bubbler')).toHaveText('起泡器在冒泡。');
    for (const [port, tap] of [[2, 'vac'], [2, 'n2'], [4, 'n2'], [2, 'closed']] as const) await d.locator(`.sk__tap[data-port="${port}"][data-tap="${tap}"]`).tap();
    await d.getByRole('button', { name: '放氣閥：關' }).first().tap();
    await expect(d.locator('.sk__tube')).toHaveText('她的管子：裝著深色的液體，活栓開著。');
    await d.getByRole('button', { name: '管子的活栓：開' }).tap();
    await d.getByRole('button', { name: '用鋁箔包起她的管子' }).tap();
    await expect(d.locator('.sk__status')).toContainText('你沒有東西可以包。');
    await expect(d.locator('.sk__tube')).toHaveText('她的管子：現在是透明的。裡面不管是什麼，都放棄了。');
    await expect(d.locator('.sk__tap').first()).toBeDisabled();
    expect(await noSideScroll(page)).toBe(true);
    await d.getByRole('button', { name: '把它放下' }).tap();

    await expect(page.locator('.pz')).toHaveCount(0);
    await expect(page.locator('.narrative__text')).toContainText('裡面有什麼東西放棄了');
    await expect(page.locator('.narrative__carry')).toHaveCount(0);
    await expect(page.locator('.choice[data-choice="synth.kraken.fill"]')).toHaveCount(0);
  });

  test('a tapped toggle shows its own state, never a hover left behind (#67)', async ({ page }) => {
    await resume(page, kraken('en', true), 'en');
    const { d } = await open(page, 'synth.kraken.fill', 'tap');
    const border = (sel: string) => d.locator(sel).evaluate((el) => getComputedStyle(el).borderTopColor);
    // A phone has no hover. After a tap, a touch browser leaves :hover on what was tapped; Playwright's
    // tap doesn't, so put the pointer there as the browser would and check the control still shows its state.
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
    const tapAndLinger = async (sel: string) => {
      await d.locator(sel).tap();
      await d.locator(sel).hover();
    };
    // The nitrogen main, then port 2 to nitrogen: each keeps its "on" colour.
    await tapAndLinger('.sk__n2');
    await expect(d.locator('.sk__n2')).toHaveAttribute('data-on', 'true');
    expect(await border('.sk__n2')).toBe('rgb(111, 183, 238)');
    const n2 = '.sk__tap[data-port="2"][data-tap="n2"]';
    await tapAndLinger(n2);
    await expect(d.locator(n2)).toHaveAttribute('aria-checked', 'true');
    expect(await border(n2)).toBe('rgb(111, 183, 238)');
    // A plain button keeps its plain look with the pointer left on it.
    const hint = page.locator('.pz__hint-btn');
    const plain = await hint.evaluate((el) => getComputedStyle(el).borderTopColor);
    await hint.hover();
    expect(await hint.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(plain);
  });

  test('the three spectra in 繁中, by touch: everything fits, and every circle can be tapped', async ({ page }) => {
    await resume(page, spectra('zh-Hant-TW'), 'zh-Hant-TW');
    const { d } = await open(page, 'office.compare', 'tap');
    await expect(page.getByRole('dialog', { name: '三張譜' })).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
    await d.getByRole('button', { name: '把印出來的譜疊到圖三上' }).tap();
    await expect(d.locator('.fb__status')).toHaveText('你把印出來的譜疊在圖三上，對著螢幕的光看。');
    for (const name of ['它的雜訊，疊在圖三的雜訊上', '積分值 1.000，和它底下的基線', '標頭：03:33 收的']) {
      await d.getByRole('button', { name }).tap();
      await expect(d.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(d.locator('.fb__circled')).toHaveText('圈起來的：它的雜訊，疊在圖三的雜訊上；積分值 1.000，和它底下的基線；標頭：03:33 收的。');
    await expect(d.locator('.fb__enough')).toBeVisible();
    expect(await noSideScroll(page)).toBe(true);
    await d.locator('.fb__finish').tap();
    await expect(page.locator('.pz')).toHaveCount(0);
  });
});

// ── P8 · The chirp ─────────────────────────────────────────────────────────

/** Watch the compressor's light: what it shows at each chirp (steady: segments lit; flashing: flashes). */
async function watchLight(d: Locator) {
  await d.evaluate((root) => {
    const w = window as unknown as { light: Array<{ chirps: number; lit: number; flash: boolean }> };
    w.light = [];
    const light = root.querySelector<HTMLElement>('.cp__strip, .cp__led')!;
    new MutationObserver(() => {
      const chirps = Number(light.dataset['chirps']);
      // Back to 0: the pattern starts again from the top, so only the last full play is kept.
      if (chirps === 0) w.light = [];
      else w.light.push({ chirps, lit: light.querySelectorAll('.cp__seg--on').length, flash: light.classList.contains('cp__led--on') });
    }).observe(light, { attributes: true, attributeFilter: ['data-chirps'] });
  });
  // Play it from the top with the watcher in place, as a player would; it takes a few seconds.
  await d.getByRole('button', { name: /^(Listen again|Listening…|再聽一次|聽著……)$/ }).click();
  await expect(d.locator('.cp__listen')).toHaveAttribute('aria-busy', 'true');
  await expect(d.locator('.cp__listen')).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 });
  return d.evaluate(() => (window as unknown as { light: Array<{ chirps: number; lit: number; flash: boolean }> }).light);
}

test('the chirp with the sound off and motion reduced: steady segments count 2 · 4 · 1 · 3; a guess from the wrong group is set straight; Enter sends the PIN', async ({ page }) => {
  test.setTimeout(60_000);
  await resume(page, ups('en'), 'en');
  const { d, at } = await open(page, 'nmr.ups');
  await expect(page.getByRole('dialog', { name: 'The UPS panel' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-flicker', 'off');
  await expect(d.locator('.cp__led')).toHaveCount(0);

  // Nothing flashes: each chirp lights one more segment, and a new group starts again from one.
  const seen = await watchLight(d);
  expect(seen.map((s) => s.chirps)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(seen.map((s) => s.lit)).toEqual([1, 2, 1, 2, 3, 4, 1, 1, 2, 3]);
  expect(seen.some((s) => s.flash)).toBe(false);
  await expect(d.locator('.cp__heard')).toHaveText('A long pause, and it starts again.');
  await expect(d.locator('.cp__listen')).toHaveText('Listen again');

  // The keypad is one Tab stop; the arrows walk it, the number keys type.
  const keypad = d.getByRole('group', { name: 'UPS keypad' });
  await keypad.getByRole('button', { name: '1', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(keypad.getByRole('button', { name: '5', exact: true })).toBeFocused();
  for (const digit of '4132') await page.keyboard.press(digit);
  await expect(d.locator('.cp__digits [aria-hidden]')).toHaveText('4 1 3 2');
  await expect(d.locator('.cp__digits .sr-only')).toHaveText('PIN: 4 1 3 2');
  await page.keyboard.press('Enter');
  await expect(d.locator('.cp__status')).toHaveText('Two short beeps, and the display clears: PIN REJECTED. Somewhere in the rhythm, one pause is longer than the others.');
  // A minute standing there listening, and one for the wrong PIN.
  await expect(d.locator('.pz__clock-time')).toHaveText(at(2));
  await expect(d.locator('.cp__digits [aria-hidden]')).toHaveText('_ _ _ _');

  for (const digit of '2413') await page.keyboard.press(digit);
  await page.keyboard.press('Enter');
  await expect(d.locator('.cp__screen')).toHaveText('UPS ARMED');
  await expect(d.locator('.cp__status')).toContainText('The amber turns green');
  await expect(d.getByRole('button', { name: 'Write the PIN down' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.pz')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('2413. Her rhythm');
  await expect(page.locator('.choice[data-choice="nmr.ups"]')).toHaveCount(0);
});

test('the chirp in 繁中, with motion and flicker on: the LED flashes once a chirp, and tapping her rhythm in arms the UPS', async ({ page }) => {
  test.setTimeout(60_000);
  await resume(page, ups('zh-Hant-TW'), 'zh-Hant-TW', { motion: true });
  const { d } = await open(page, 'nmr.ups');
  await expect(page.getByRole('dialog', { name: 'UPS 面板' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-flicker', 'on');
  await expect(d.locator('.cp__strip')).toHaveCount(0);
  const seen = await watchLight(d);
  expect(seen.map((s) => s.chirps)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(seen.every((s) => s.flash)).toBe(true);
  await expect(d.locator('.cp__heard')).toHaveText('停了很久，然後又從頭開始。');

  for (const key of ['2', '4', '1', '3']) await d.locator(`.cp__key[data-key="${key}"]`).click();
  await d.getByRole('button', { name: '確定' }).click();
  await expect(d.locator('.cp__status')).toContainText('琥珀色轉成綠色');
  await d.getByRole('button', { name: '把密碼記下來' }).click();
  await expect(page.locator('.pz')).toHaveCount(0);
  await expect(page.locator('.narrative__text')).toContainText('2413。她在跑譜的時候');
});

// ── P9 · The too-perfect spectrum ──────────────────────────────────────────

test('the three spectra: noise means nothing alone and the coffee ring nothing at all; laid over Figure 3, the noise is one line', async ({ page }) => {
  await resume(page, spectra('en'), 'en');
  const { d, at } = await open(page, 'office.compare');
  await expect(page.getByRole('dialog', { name: 'Three spectra' })).toBeVisible();
  const status = d.locator('.fb__status');
  const printout = d.locator('figure[data-plot="printout"]');
  const figure = d.locator('figure[data-plot="figure"]');

  // The same noise, drawn from the same numbers; yours is your own.
  const points = (l: Locator) => l.getAttribute('points');
  const printNoise = await points(printout.locator('.fb__strip polyline'));
  expect(printNoise).toBeTruthy();
  expect(await points(figure.locator('.fb__strip polyline.fb__trace--figure'))).toBe(printNoise);
  expect(await points(d.locator('figure[data-plot="own"] polyline'))).not.toBe(await points(printout.locator('.fb__frame polyline')));

  // Reading them side by side takes a couple of minutes, whatever you circle.
  await expect(d.locator('.pz__clock-time')).toHaveText(at(0));
  await d.getByRole('button', { name: 'The noise in Figure 3’s baseline' }).click();
  await expect(status).toHaveText('It’s noise. Every spectrum has some. On its own it tells you nothing.');
  await expect(d.locator('.pz__clock-time')).toHaveText(at(2));
  await d.getByRole('button', { name: 'A brown ring in the corner' }).click();
  await expect(status).toHaveText('That’s just your coffee ring.');
  await d.getByRole('button', { name: 'The peak at 8.41' }).click();
  await expect(status).toContainText('except the wanting');
  await expect(d.locator('.fb__circled')).toHaveText('Nothing circled yet.');

  const overlay = d.getByRole('button', { name: 'Lay the printout over Figure 3' });
  await overlay.click();
  await expect(overlay).toHaveAttribute('aria-pressed', 'true');
  await expect(figure).toHaveAttribute('data-overlay', 'true');
  expect(await points(figure.locator('.fb__strip polyline.fb__trace--over'))).toBe(printNoise);

  const noise = d.getByRole('button', { name: 'Its noise, laid over Figure 3’s' });
  await noise.focus();
  await page.keyboard.press('Enter');
  await expect(noise).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText('Point for point, the printout’s noise lies exactly on Figure 3’s. Noise is never the same twice. This was.');
  // A second tap rubs a circle out, and a third puts it back.
  const solvent = d.getByRole('button', { name: 'Around 7.16 ppm' });
  await solvent.click();
  await solvent.click();
  await expect(status).toHaveText('You rub that circle out.');
  await solvent.click();
  await d.getByRole('button', { name: 'Either side of the big peak' }).click();
  await expect(d.locator('.fb__circled')).toHaveText('Circled: Its noise, laid over Figure 3’s; Around 7.16 ppm; Either side of the big peak.');
  await expect(d.locator('.fb__enough')).toHaveText('Enough. More than enough.');
  await expect(d.locator('.pz__clock-time')).toHaveText(at(2));
  await expect(d.getByRole('button', { name: 'Write down what you’ve found' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('.pz')).toHaveCount(0);
  await page.keyboard.press('n');
  const nb = page.getByRole('dialog', { name: 'Notebook' });
  await nb.getByRole('tab', { name: 'Data' }).click();
  await expect(nb).toContainText('Figure 3 is the night’s');
});

// ── P10 · Peak match in the dark ───────────────────────────────────────────

test('in 繁中, at 03:33: the peak match in the game, and finding 8.41 in the dark is Dark Reaction', async ({ page }) => {
  await resume(page, inTheDark('zh-Hant-TW'), 'zh-Hant-TW');
  const d = page.getByRole('dialog', { name: '黑暗中' });
  await expect(d).toBeVisible();
  await expect(d.locator('.pz__clock-time')).toHaveText('03:33');
  expect(await noSideScroll(page)).toBe(true);
  await SOLVERS['peakmatch']!(page);
  await expect(page.locator('.pz')).toHaveCount(0);
  // The dark run's wiring is e2e/dark.spec.ts; here, the puzzle's own answer ends the night for good.
  await expect(page.locator('article.ending[data-ending="dark"]')).toBeVisible();
  await expect(page.locator('.ending__title')).toHaveText('暗反應');
});

// ── In the puzzle harness ──────────────────────────────────────────────────

let bundle = '';
test.describe('in the harness', () => {
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

  interface Opts {
    puzzle: string;
    act?: number;
    items?: string[];
    flicker?: boolean;
    reduceMotion?: boolean;
  }
  type Log = { finished: Array<{ solved: boolean; minutes: number; failed?: boolean }>; cues: string[] };
  async function mount(page: Page, minute: number, opts: Opts) {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent('<!doctype html><html lang="en-GB"><body><div id="host"></div></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(
      ([m, o]) => {
        const w = window as unknown as { DRPuzzle: { setup(m: number, h: number, o: unknown): unknown }; harness: unknown };
        w.harness = w.DRPuzzle.setup(m as number, 0, { act: 3, ...(o as object) });
      },
      [minute, opts] as const,
    );
    return errors;
  }
  const log = (page: Page) => page.evaluate(() => (window as unknown as { harness: { log: Log } }).harness.log);

  test('the peak match in the dark: green on black, the clock stopped at 03:33, and 8.41 means nothing until the solvent is at 7.16', async ({ page }) => {
    const errors = await mount(page, 46, { puzzle: 'peakmatch' });
    const d = page.getByRole('dialog', { name: 'In the dark' });
    await expect(d).toBeVisible();
    await expect(d.locator('.pz__clock-time')).toHaveText('03:33');
    expect(await d.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(0, 0, 0)');
    const [r, g, b] = (await d.locator('.pm__plot .pm__trace').evaluate((el) => getComputedStyle(el).stroke)).match(/\d+/g)!.map(Number);
    expect(g!).toBeGreaterThan(Math.max(r!, b!) + 60);

    const status = d.locator('.pm__status');
    const peaks = d.getByRole('group', { name: 'Peaks on the screen' });
    await expect(peaks.getByRole('button')).toHaveText(['Peak at 8.18 ppm', 'Peak at 7.96 ppm', 'Peak at 6.93 ppm', 'Peak at 6.67 ppm']);
    await peaks.getByRole('button', { name: 'Peak at 8.18 ppm' }).click();
    await expect(status).toHaveText('The axis says 8.18. But the solvent isn’t at 7.16 yet, so the axis can’t be trusted.');

    // Referencing by keyboard: Page Up is a tenth, the arrows a hundredth.
    const slider = d.getByRole('slider', { name: 'Referencing' });
    await slider.focus();
    await page.keyboard.press('PageUp');
    await page.keyboard.press('PageUp');
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowUp');
    await expect(slider).toHaveAttribute('aria-valuetext', '+0.23 ppm');
    await expect(d.locator('.pm__label--solvent')).toHaveText('7.16');
    await expect(d.locator('.pm__label--product')).toHaveText('8.41');

    // The bare peak at 8.19 is close, and wrong; hers is the small one with satellites.
    await peaks.getByRole('button', { name: 'Peak at 8.19 ppm' }).focus();
    await page.keyboard.press('Enter');
    await expect(status).toHaveText('8.19: close, but bare. Hers has a satellite either side.');
    await page.keyboard.press('ArrowLeft');
    await expect(peaks.getByRole('button', { name: 'Peak at 8.41 ppm' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(status).toContainText('Exactly where her reference said.');
    await expect(d.locator('.pz__clock-time')).toHaveText('03:33');
    await expect(d.getByRole('button', { name: 'Stay with it' })).toBeFocused();
    await page.keyboard.press('Enter');
    expect((await log(page)).finished).toEqual([{ solved: true, minutes: 0 }]);
    expect(errors).toEqual([]);
  });

  test('the peak match keeps its referencing through a switch to 繁中', async ({ page }) => {
    await mount(page, 46, { puzzle: 'peakmatch' });
    for (let i = 0; i < 2; i++) await page.locator('.pm__nudge[data-by="10"]').click();
    await page.evaluate(() => {
      const w = window as unknown as { DRPuzzle: { switchLocale(l: string, f: unknown): void }; harness: { frame: unknown } };
      w.DRPuzzle.switchLocale('zh-Hant-TW', w.harness.frame);
    });
    const d = page.getByRole('dialog', { name: '黑暗中' });
    await expect(d.getByRole('slider', { name: '校正' })).toHaveAttribute('aria-valuetext', '+0.20 ppm');
    await expect(d.getByRole('button', { name: '8.38 ppm 的峰' })).toBeVisible();
    await expect(d.locator('.pm__ref-title')).toHaveText('她的參考譜 · 第 19 週 · 來自 microSD');
  });

  test('the Kraken reads the foil from what you carry: wrapped with it, spoiled without', async ({ page }) => {
    for (const [items, result] of [
      [['item.foil'], { solved: true, minutes: 6 }],
      [[], { solved: false, minutes: 6, failed: true }],
    ] as const) {
      await mount(page, 10, { puzzle: 'schlenk', items: [...items] });
      await SOLVERS['schlenk']!(page);
      expect((await log(page)).finished, JSON.stringify(items)).toEqual([result]);
    }
  });

  test('the chirp flashes only with flicker allowed and motion not reduced, and cues a sound for every chirp', async ({ page }) => {
    test.setTimeout(60_000);
    for (const [flicker, reduceMotion, mode] of [
      [true, false, 'flash'],
      [false, false, 'steady'],
      [true, true, 'steady'],
    ] as const) {
      await mount(page, 10, { puzzle: 'chirp', flicker, reduceMotion });
      await expect(page.locator(`.cp__panel--${mode}`), `${flicker} ${reduceMotion}`).toHaveCount(1);
    }
    // The last mount plays its pattern once on arrival: ten chirps, ten cues.
    await expect(page.locator('.cp__listen')).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 });
    expect((await log(page)).cues.filter((c) => c === 'chirp')).toHaveLength(10);
  });

  test('the bot solves all four', async ({ page }) => {
    for (const [puzzle, minute] of [
      ['schlenk', 10],
      ['chirp', 10],
      ['fabrication', 40],
      ['peakmatch', 46],
    ] as const) {
      await mount(page, minute, { puzzle, items: ['item.foil'] });
      await SOLVERS[puzzle]!(page);
      expect((await log(page)).finished[0]?.solved, puzzle).toBe(true);
    }
  });
});
