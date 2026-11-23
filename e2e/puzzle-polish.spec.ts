import { expect, test } from '@playwright/test';
import { LOOP_LENGTH } from '../src/engine/clock.ts';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const base = 'http://localhost:4173/dark-reaction/';
const view = { locale: 'en', reduceMotion: true, highContrast: false } as const;
const target = (name: string) => targets().find((t) => t.name === name)!;

/** #150: the console after a language switch, and a long command. */
test('after a language switch the console shows its latest lines (#150)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-console'), view);
  for (const c of ['help', 'queue --all', 'log', 'help', 'queue']) await page.locator(`.con__chip[data-command="${c}"]`).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: '繁體中文' }).click();
  await page.keyboard.press('Escape');
  const log = page.locator('.con__log');
  await expect(log).toBeVisible();
  const { top, height, client } = await log.evaluate((el) => ({ top: el.scrollTop, height: el.scrollHeight, client: el.clientHeight }));
  expect(height).toBeGreaterThan(client);
  expect(top + client).toBeGreaterThanOrEqual(height - 2);
});

test('a long command wraps on a phone, as output does (#150)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadTarget(page, base, target('puzzle-console'), view);
  await page.locator('.con__input').fill('x'.repeat(300));
  await page.locator('.con__input').press('Enter');
  const line = page.locator('.con__line--in').last();
  expect(await line.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

/** #151: a click on the door log's timeline marks the nearest minute. */
test('a click just short of 03:21 on the timeline marks 03:21 (#151)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-doorlog'), view);
  const track = page.locator('.dl__track').last();
  await track.scrollIntoViewIfNeeded();
  const box = (await track.boundingBox())!;
  await page.mouse.click(box.x + (34 / LOOP_LENGTH) * box.width - 2, box.y + box.height / 2);
  await expect(track).toHaveAttribute('aria-valuetext', /03:21/);
});

/** #159: the three spectra say what reading them costs, as the other puzzles do since #118. */
test('the three spectra say what reading them costs (#159)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-fabrication'), view);
  await expect(page.locator('.pz__intro')).toContainText('a couple of minutes');
});
