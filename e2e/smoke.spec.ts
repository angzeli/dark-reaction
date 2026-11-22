import { expect, test } from '@playwright/test';

test('the built game loads with no console errors and no outside requests', async ({ page, baseURL }) => {
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

  await page.goto('./');
  await expect(page).toHaveTitle(/Dark Reaction/);
  await expect(page.locator('h1')).toContainText('Dark Reaction');

  // The self-hosted, subset fonts load and cover both scripts in the title.
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('16px "Source Serif 4"', 'Dark Reaction'),
      document.fonts.load('16px "Noto Serif TC"', '暗反應'),
      document.fonts.load('16px "IBM Plex Mono"', '02:47'),
    ]);
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  });
  expect(fonts).toEqual(expect.arrayContaining(['Source Serif 4', 'Noto Serif TC', 'IBM Plex Mono']));

  expect(errors, 'console errors').toEqual([]);
  expect(outside, 'requests outside the page origin').toEqual([]);
});
