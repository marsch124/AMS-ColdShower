// Test 3: the ring guides six slow breaths at the start of the countdown, then
// stops by itself; the Settings switch turns it off.
import { test, expect } from '@playwright/test';
import { openApp, seenOpacity } from './_app.js';

// The animation that draws the guide, as the page sees it.
const guide = (page) => page.evaluate(() => {
  const a = document.getElementById('breath').getAnimations()
    .find((x) => x.animationName === 'breathguide');
  if (!a) return null;
  const t = a.effect.getTiming();
  return { iterations: t.iterations, duration: t.duration };
});

test('the ring breathes for the first minute, and the switch turns it off', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cst.leadIn', '0');        // straight into the countdown
    localStorage.setItem('cst.holdStop', '0');      // a plain tap stops
  });
  await openApp(page);

  await page.getByTestId('start-btn').click();
  await expect(page.locator('body[data-breath="on"]')).toBeAttached();
  expect(await guide(page)).toEqual({ iterations: 6, duration: 10000 });   // 6 × (4 s in + 6 s out)
  // ...and the screen it breathes on is still there to read.
  expect(await seenOpacity(page, 'time')).toBe(1);
  expect(await seenOpacity(page, 'start-btn')).toBe(1);

  // Jump the guide to its end: the app hears it finish and lets go.
  await page.evaluate(() => {
    const a = document.getElementById('breath').getAnimations()
      .find((x) => x.animationName === 'breathguide');
    a.currentTime = 60000;
  });
  await expect(page.locator('body[data-breath="done"]')).toBeAttached();
  expect(await guide(page)).toBeNull();

  await page.getByTestId('start-btn').click();      // stop
  await page.getByTestId('finish-done').click();

  // Switched off: the next shower starts without it.
  await page.getByTestId('settings-btn').click();
  await page.getByTestId('breath-toggle').click();
  await expect(page.getByTestId('breath-toggle')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('settings-back').click();
  await page.getByTestId('start-btn').click();
  await expect(page.locator('body[data-breath="off"]')).toBeAttached();
  expect(await guide(page)).toBeNull();
});
