import { expect, test, type Page } from '@playwright/test';
import { build } from 'vite';

/**
 * The shared puzzle frame with the sample dial lock, in a real browser:
 * hints reveal in order and stop at three, the clock moves as minutes are
 * spent, a language switch keeps the puzzle's state, everything works
 * from the keyboard alone, and 03:33 ends the attempt.
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

async function open(page: Page, startMinute: number, hintsUsed = 0) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setContent('<!doctype html><html lang="en-GB"><body><div id="host"></div></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(([m, h]) => {
    const w = window as unknown as { DRPuzzle: { setup(m: number, h: number): unknown }; harness: unknown };
    w.harness = w.DRPuzzle.setup(m!, h!);
  }, [startMinute, hintsUsed]);
  return errors;
}
const log = (page: Page) =>
  page.evaluate(() => (window as unknown as { harness: { log: { finished: unknown[]; hints: number; saved: unknown[] } } }).harness.log);

test('hints reveal in order and stop at three', async ({ page }) => {
  await open(page, 0);
  const button = page.locator('.pz__hint-btn');
  await expect(button).toHaveText('Hint (1 of 3)');
  for (let i = 1; i <= 3; i++) await button.click();
  await expect(page.locator('.pz__hint')).toHaveCount(3);
  await expect(page.locator('.pz__hint').nth(2)).toContainText('Set the dials to 2, 4 and 1.');
  await expect(button).toBeDisabled();
  await expect(button).toHaveText('No more hints');
  expect((await log(page)).hints).toBe(3);
});

test('hints already revealed in an earlier loop stay revealed', async ({ page }) => {
  await open(page, 0, 2);
  await expect(page.locator('.pz__hint')).toHaveCount(2);
  await expect(page.locator('.pz__hint-btn')).toHaveText('Hint (3 of 3)');
});

test('solving by keyboard alone reports the minutes spent and moves the clock', async ({ page }) => {
  await open(page, 10);
  await expect(page.locator('.pz__clock-time')).toHaveText('02:57');
  // Focus starts on the title; Tab walks the controls in order: [− 1 +] ×3.
  const press = async (selector: string, times: number) => {
    await page.locator(selector).focus();
    for (let i = 0; i < times; i++) await page.keyboard.press('Enter');
  };
  await press('button[data-dial="0"][data-dir="up"]', 2);
  await press('button[data-dial="1"][data-dir="up"]', 4);
  await expect(page.locator('.pz__clock-time')).toHaveText('02:58'); // six turns: one minute
  await press('button[data-dial="2"][data-dir="up"]', 1);
  const l = await log(page);
  expect(l.finished).toEqual([{ solved: true, minutes: 1 }]);
  await expect(page.locator('.pz')).toHaveCount(0);
});

test('a language switch keeps the dials where they were', async ({ page }) => {
  await open(page, 0);
  await page.locator('button[data-dial="1"][data-dir="up"]').click();
  await page.locator('button[data-dial="1"][data-dir="up"]').click();
  await page.evaluate(() => {
    const w = window as unknown as { DRPuzzle: { switchLocale(l: string, f: unknown): void }; harness: { frame: unknown } };
    w.DRPuzzle.switchLocale('zh-Hant-TW', w.harness.frame);
  });
  await expect(page.locator('.pz__title')).toHaveText('三轉盤密碼鎖');
  await expect(page.locator('.pz__leave')).toHaveText('先離開');
  await expect(page.locator('#demo-dial-1')).toHaveText('2');
  await expect(page.locator('button[data-dial="1"][data-dir="up"]')).toHaveAttribute('aria-label', '把轉盤 2 往上轉');
});

test('03:33 ends the attempt mid-puzzle; stepping away ends it too', async ({ page }) => {
  await open(page, 45);
  for (let i = 0; i < 4; i++) await page.locator('button[data-dial="0"][data-dir="down"]').click();
  expect((await log(page)).finished).toEqual([{ solved: false, minutes: 1 }]);
  await open(page, 0);
  await page.locator('.pz__leave').click();
  expect((await log(page)).finished).toEqual([{ solved: false, minutes: 0 }]);
});

test('the frame is a labelled modal dialog and keeps Tab inside', async ({ page }) => {
  await open(page, 0);
  const dialog = page.getByRole('dialog', { name: 'A three-dial lock' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.pz'))).toBe(true);
  }
});
