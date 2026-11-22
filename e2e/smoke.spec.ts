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

  expect(errors, 'console errors').toEqual([]);
  expect(outside, 'requests outside the page origin').toEqual([]);
});
