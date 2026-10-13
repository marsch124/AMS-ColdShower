// Test 9: on a small iPhone with the backup reminder showing, the START button
// is still fully on screen — the idle dial gives way, its number shrinks with
// it — and the dial grows back once the reminder is dismissed.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

// Where START ends vs. where the screen's usable area ends, and how wide the
// number is compared with the dial (it must shrink WITH the dial, not stay put).
const measure = (page) => page.evaluate(() => {
  const btn = document.querySelector('[data-testid="start-btn"]').getBoundingClientRect();
  const padB = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
  const dial = document.querySelector('.dial');
  const t = document.querySelector('[data-testid="time"]').getBoundingClientRect();
  return { overBottom: Math.round(btn.bottom - (innerHeight - padB)),
           digitsToDial: t.width / dial.offsetWidth, dialWidth: dial.offsetWidth };
});

test('START stays on screen with the backup reminder on a small iPhone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });   // iPhone SE
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }]));
    localStorage.setItem('cst.active', 'u1');
    // six showers and never a backup → the monthly reminder is due
    localStorage.setItem('cst.sessions.u1', JSON.stringify([5, 6, 7, 8, 9, 10].map((d) => (
      { t: Date.parse(`2026-10-${String(d).padStart(2, '0')}T07:00:00`), goal: 180, dur: 200, reached: true, bonus: 20 }))));
  });
  await openApp(page);

  await expect(page.getByTestId('backup-nudge')).toBeVisible();
  const squeezed = await measure(page);
  expect(squeezed.overBottom).toBeLessThanOrEqual(0);
  expect(Number(await page.locator('body').getAttribute('data-fit'))).toBeGreaterThan(0);

  // Reminder dismissed: the room comes back and the dial takes it.
  await page.getByTestId('backup-dismiss').click();
  await expect(page.getByTestId('backup-nudge')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-fit', '0');
  const relaxed = await measure(page);
  expect(relaxed.overBottom).toBeLessThanOrEqual(0);
  expect(relaxed.dialWidth).toBeGreaterThan(squeezed.dialWidth);
  // squeezed, the number kept its proportion to the ring — it did not spill over
  expect(squeezed.digitsToDial).toBeLessThanOrEqual(relaxed.digitsToDial * 1.01);
});
