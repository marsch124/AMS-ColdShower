// Test 10: the top bar is drawn at full strength — the name chip's round
// initial and the Settings cog are one solid colour (no pale-to-bright fade,
// which read as a haze over their tops), and nothing up there is faded out.
import { test, expect } from '@playwright/test';
import { openApp, seenOpacity } from './_app.js';

const ICE = 'rgb(127, 227, 255)';

test('the top bar is solid and at full strength', async ({ page }) => {
  await openApp(page);

  const av = await page.getByTestId('user-chip-av').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { image: cs.backgroundImage, color: cs.backgroundColor };
  });
  expect(av).toEqual({ image: 'none', color: ICE });

  const cogFill = await page.getByTestId('settings-cog').getAttribute('fill');
  expect(cogFill).toBe('#7fe3ff');

  for (const id of ['user-chip', 'stats-btn', 'settings-btn']) {
    expect(await seenOpacity(page, id), id).toBe(1);
  }
});
