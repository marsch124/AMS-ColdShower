// Test 1: the app starts, raises no error, and names the version its own
// version log says it is.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

test('the app starts and shows its version', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${e}`));

  await openApp(page);

  // The version label is EMPTY in the markup; only the code fills it, from the
  // newest version-log entry. Reading that entry straight from the served file
  // proves the code ran and that label and log agree.
  const html = await (await page.request.get('/index.html')).text();
  const newest = html.match(/const VERSIONLOG = \[\s*\{ v: '(v\d+\.\d+)'/);
  expect(newest, 'the version log has a newest entry').not.toBeNull();
  await expect(page.getByTestId('app-version')).toHaveText(newest[1]);

  for (const id of ['user-chip', 'stats-btn', 'settings-btn', 'start-btn']) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  expect(errors, 'starting raised no error').toEqual([]);
});
