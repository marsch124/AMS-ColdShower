// Test 6: the home screen shows the last seven days as seven dots — a rolling
// week, today on the right — filled for the days showered, an empty circle
// otherwise, nothing else (no ring); and nothing before the first shower.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

test('the last seven days show as seven plain dots, today on the right', async ({ page }) => {
  // Wednesday 14 October 2026, mid-morning → the row is Thu 8 … Wed 14.
  await page.clock.install({ time: new Date('2026-10-14T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-14T10:00:01'));
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }, { id: 'u2', name: 'New' }]));
    localStorage.setItem('cst.active', 'u1');
    const s = (iso, dur) => ({ t: Date.parse(iso), goal: 180, dur, reached: dur >= 180, bonus: Math.max(0, dur - 180) });
    localStorage.setItem('cst.sessions.u1', JSON.stringify([
      s('2026-10-07T07:00:00', 200),   // a week ago yesterday — just off the row
      s('2026-10-11T07:00:00', 200),   // Sunday
      s('2026-10-12T07:00:00', 210),   // Monday
      s('2026-10-14T07:00:00', 190),   // today
    ]));
  });
  await openApp(page);

  const dots = page.getByTestId('week-dots');
  await expect(dots).toBeVisible();
  await expect(dots.locator('i')).toHaveCount(7);
  await expect(dots).toHaveAttribute('data-days', '0001101');   // Thu Fri Sat Sun Mon Tue Wed
  // Plain dots only: no ring or halo on any of them, today included.
  const shadows = await dots.locator('i').evaluateAll((els) => els.map((el) => getComputedStyle(el).boxShadow));
  expect(shadows).toEqual(Array(7).fill('none'));

  // A profile with no showers yet has no row at all.
  await page.getByTestId('user-chip').click();
  await page.locator('[data-testid="user-row"][data-user="u2"]').getByTestId('user-row-name').click();
  await expect(dots).toBeHidden();
  await expect(dots).toHaveAttribute('data-days', '');
});
