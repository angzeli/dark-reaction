import { expect, test } from '@playwright/test';
import { loadTarget } from '../scripts/qa/lib/browser.ts';
import { targets } from '../scripts/qa/lib/targets.ts';

const base = 'http://localhost:4173/dark-reaction/';
const target = (name: string) => targets().find((t) => t.name === name)!;
const view = { locale: 'en' as const, reduceMotion: true, highContrast: false };

test('the play screen has headings to jump by: the room, then what you can do (#112)', async ({ page }) => {
  await loadTarget(page, base, target('act2-office'), view);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('4.08 Write-up office');
  await expect(page.getByRole('heading', { level: 2, name: 'What you can do' })).toBeAttached();
  await expect(page.getByRole('list', { name: 'What you can do' })).toBeAttached();
});

test('the header is opaque: nothing shows through it (#120)', async ({ page }) => {
  await loadTarget(page, base, target('act2-office'), view);
  const alpha = await page.locator('.hud').evaluate((el) => {
    const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/)!;
    const parts = m[1]!.split(',').map(Number);
    return parts.length === 4 ? parts[3] : 1;
  });
  expect(alpha).toBe(1);
});

test('a puzzle opens at its top, below the header, even one that focuses its own control (#110)', async ({ browser }) => {
  for (const name of ['puzzle-console', 'puzzle-doorlog', 'puzzle-tlc']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await loadTarget(page, base, target(name), view);
    const hud = (await page.locator('.hud').boundingBox())!;
    const top = (await page.locator('.pz__title').boundingBox())!;
    expect(top.y, name).toBeGreaterThanOrEqual(hud.y + hud.height - 1);
    expect(top.y, name).toBeLessThan(800);
    await context.close();
  }
});

test('on a phone, setting a time in the door log doesn’t push the timeline down (#120)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await loadTarget(page, base, target('puzzle-doorlog'), { ...view, locale: 'zh-Hant-TW' });
  const row = page.locator('.dl__mark[data-row="exit"]');
  const track = row.locator('.dl__track');
  await track.scrollIntoViewIfNeeded();
  const value = await row.locator('.dl__value').textContent();
  const before = (await track.boundingBox())!.y;
  await row.locator('.dl__nudge[data-delta="1"]').click();
  await expect(row.locator('.dl__value')).not.toHaveText(value!);
  const after = (await track.boundingBox())!.y;
  expect(Math.abs(after - before)).toBeLessThan(2);
  await context.close();
});
