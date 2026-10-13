// Test 8: the finish screen shows the profile's photo in a ring of the verdict
// colour — and nothing at all (not even a letter) for a profile with no photo.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

// A real 1×1 PNG (the same one the TechLingo tests use), so the stored
// "photo" decodes like one.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function jump(page, ms) {
  await page.clock.fastForward(ms - 200);
  await page.clock.runFor(200);
}

test('the finish screen shows your face in the verdict colour', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T07:00:00') });
  await page.clock.pauseAt(new Date('2026-10-14T07:00:01'));
  await page.addInitScript((png) => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.leadIn', '0');
    localStorage.setItem('cst.holdStop', '0');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }, { id: 'u2', name: 'Guest' }]));
    localStorage.setItem('cst.active', 'u1');
    localStorage.setItem('cst.goal.u1', '60');
    localStorage.setItem('cst.goal.u2', '60');
    localStorage.setItem('cst.photo.u1', png);
    localStorage.setItem('cst.sessions.u1', JSON.stringify([
      { t: Date.parse('2026-10-13T07:00:00'), goal: 60, dur: 300, reached: true, bonus: 240 }]));
  }, PNG);
  await openApp(page);
  const face = page.getByTestId('finish-face');

  // Goal made (1:10 of 1:00, record not beaten): face, green verdict.
  await page.getByTestId('start-btn').click();
  await jump(page, 70_000);
  await page.getByTestId('start-btn').click();       // stop
  await expect(page.getByTestId('finish')).toHaveAttribute('data-verdict', 'hit');
  await expect(face).toBeVisible();
  await expect(face).toHaveAttribute('data-photo', '1');
  expect(await face.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(44, 224, 122)');
  await page.getByTestId('finish-done').click();

  // A profile with no photo: no face at all.
  await page.getByTestId('user-chip').click();
  await page.locator('[data-testid="user-row"][data-user="u2"]').getByTestId('user-row-name').click();
  await page.getByTestId('start-btn').click();
  await jump(page, 20_000);
  await page.getByTestId('start-btn').click();       // stop, well short
  await expect(page.getByTestId('finish')).toHaveAttribute('data-verdict', 'miss');
  await expect(face).toBeHidden();
});
