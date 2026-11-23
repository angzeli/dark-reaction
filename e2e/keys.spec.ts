import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const base = 'http://localhost:4173/dark-reaction/';
const view = { locale: 'en', reduceMotion: true, highContrast: false } as const;
const target = (name: string) => targets().find((t) => t.name === name)!;

/** #143: the keys the README promises. */
test('M, N and Esc open the menu and the notebook from a puzzle, and the puzzle is still there after (#143)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-tlc'), view);
  await page.keyboard.press('m');
  await expect(page.locator('.overlay--menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay')).toHaveCount(0);
  await expect(page.locator('.pz')).toBeVisible();
  await page.keyboard.press('n');
  await expect(page.locator('.overlay--notebook')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.pz__title').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay--menu')).toBeVisible();
});

test('typing in the console is still typing: M is a letter there (#143)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-console'), view);
  await page.locator('.con__input').focus();
  await page.keyboard.type('m');
  await expect(page.locator('.con__input')).toHaveValue('m');
  await expect(page.locator('.overlay')).toHaveCount(0);
});

test('the arrow keys move between the buttons of a group: the TLC plate, the console’s commands (#143)', async ({ page }) => {
  await loadTarget(page, base, target('puzzle-tlc'), view);
  const spots = page.locator('.tlc__plate button');
  await spots.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(spots.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(spots.nth(2)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(spots.nth(1)).toBeFocused();
  await loadTarget(page, base, target('puzzle-console'), view);
  const chips = page.locator('.con__chip');
  await chips.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(chips.nth(1)).toBeFocused();
});

test('0 chooses a tenth choice, and the tenth choice shows it (#143)', async ({ page }) => {
  await loadTarget(page, base, target('act2-stairs'), view);
  const tenth = page.locator('.choice').nth(9);
  await expect(tenth.locator('.choice__n')).toHaveText('0');
  const id = await tenth.getAttribute('data-choice');
  await page.keyboard.press('0');
  if (id === 'meta:wait') await expect(page.locator('.choice[data-choice="wait:1"]')).toBeVisible();
  else await expect(page.locator(`.choice[data-choice="${id}"]`)).toHaveCount(0);
});
