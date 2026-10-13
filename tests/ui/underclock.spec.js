// Test 11: on an iPhone opened from the Home Screen, iOS blurs the strip just
// under the clock (measured on his phone: fading out ~45–50 pt below the top
// inset). The top bar and the Stats/Settings header must start clear of it —
// and on a screen without that inset, nothing moves.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

// The phone's real top / bottom insets (iPhone 17 Pro class), applied by the
// browser engine itself so the page's own env(safe-area-inset-*) sees them.
async function insets(page, top, bottom) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top, bottom } });
}
const topOf = (page, id) => page.getByTestId(id).evaluate((el) => el.getBoundingClientRect().top);

test('the top controls start below the blur under the clock', async ({ page }) => {
  await insets(page, 62, 34);
  await openApp(page);
  expect(await topOf(page, 'user-chip')).toBeGreaterThanOrEqual(62 + 48);
  expect(await topOf(page, 'settings-btn')).toBeGreaterThanOrEqual(62 + 48);
  await page.getByTestId('stats-btn').click();
  expect(await topOf(page, 'stats-back')).toBeGreaterThanOrEqual(62 + 48);
  await page.getByTestId('stats-back').click();

  // No inset (no clock strip): the top bar stays where it always was.
  await insets(page, 0, 0);
  await page.reload();
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  expect(await topOf(page, 'user-chip')).toBeLessThan(30);
});
