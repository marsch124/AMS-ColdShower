// Shared helpers. Controls are found by data-testid ONLY, never by the words on
// them — so wording can change freely and a test only fails when something has
// actually stopped working.
import { expect } from '@playwright/test';

// Open the app fresh and wait until its start-up code has run to the very end
// (the app writes body[data-ready] as the last line of its init).
export async function openApp(page) {
  await page.goto('/index.html');
  await settled(page);
}

// A genuine restart. (page.goto to the URL the page is already on can be a
// no-op, and data-ready would still be set from the first load — so reload.)
export async function restartApp(page) {
  await page.reload();
  await settled(page);
}

async function settled(page) {
  await expect(page.locator('body[data-ready="1"]')).toBeAttached({ timeout: 20_000 });
}

// How much of an element actually reaches the eye: its own opacity times every
// ancestor's. (Playwright's toBeVisible() counts opacity 0 as "visible", and a
// screen faded to nothing once passed a test that way.)
export async function seenOpacity(page, testid) {
  return page.getByTestId(testid).evaluate((el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  });
}
