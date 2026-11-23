import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const tlc = targets().find((t) => t.name === 'puzzle-tlc')!;
const base = 'http://localhost:4173/dark-reaction/';

test('the UV lamp says what it changed, and every spot has its own name (#106)', async ({ page }) => {
  await loadTarget(page, base, tlc, { locale: 'en', reduceMotion: true, highContrast: false });
  await page.getByRole('button', { name: 'UV lamp: off' }).click();
  // The lamp is the puzzle's turn: a screen reader hears where spots came out.
  await expect(page.locator('.tlc__readout')).toContainText('The UV lamp is on');
  await expect(page.locator('.tlc__readout')).toContainText('11');
  const names = await page.locator('.tlc__spot').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  expect(new Set(names).size).toBe(names.length);
  expect(names).toContain('Measure the top spot in lane 11');
  expect(names).toContain('Measure the only spot in lane 13');
});

test('繁中: the crude lane is worded as a lane with a name, and spots are listed with 、 (#114)', async ({ page }) => {
  await loadTarget(page, base, tlc, { locale: 'zh-Hant-TW', reduceMotion: true, highContrast: false });
  const names = await page.locator('.tlc__spot').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
  expect(names.some((n) => n.startsWith('量粗產物那一道'))).toBe(true);
  expect(names.join('')).not.toContain('第 粗產物 道');
  const description = (await page.locator('.tlc ul.sr-only').textContent()) ?? '';
  expect(description).toContain('粗產物：');
  expect(description).not.toMatch(/斑點, /);
  expect(description).toContain('、');
});
