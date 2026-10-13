// Test 6: the home screen shows this week as seven dots, Monday first — filled
// for the days showered, today marked — and nothing before the first shower.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

test('this week shows as seven dots, Monday first', async ({ page }) => {
  // Wednesday 14 October 2026, mid-morning.
  await page.clock.install({ time: new Date('2026-10-14T10:00:00') });
  await page.clock.pauseAt(new Date('2026-10-14T10:00:01'));
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }, { id: 'u2', name: 'New' }]));
    localStorage.setItem('cst.active', 'u1');
    const s = (iso, dur) => ({ t: Date.parse(iso), goal: 180, dur, reached: dur >= 180, bonus: Math.max(0, dur - 180) });
    localStorage.setItem('cst.sessions.u1', JSON.stringify([
      s('2026-10-11T07:00:00', 200),   // Sunday of LAST week — not this row
      s('2026-10-12T07:00:00', 210),   // Monday
      s('2026-10-14T07:00:00', 190),   // Wednesday = today
    ]));
  });
  await openApp(page);

  const dots = page.getByTestId('week-dots');
  await expect(dots).toBeVisible();
  await expect(dots).toHaveAttribute('data-days', '1010000');
  await expect(dots).toHaveAttribute('data-today', '2');
  await expect(dots.locator('i')).toHaveCount(7);

  // A profile with no showers yet has no row at all.
  await page.getByTestId('user-chip').click();
  await page.locator('[data-testid="user-row"][data-user="u2"]').getByTestId('user-row-name').click();
  await expect(dots).toBeHidden();
  await expect(dots).toHaveAttribute('data-days', '');
});
