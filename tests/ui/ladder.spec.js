// Test 7: five goals in a row at the same length → the app offers one more
// minute; taking it raises the goal; stay put and take a sixth shower at the
// old goal, and the offer steps aside until the next five.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

const hit = (day, goal) => ({ t: Date.parse(`2026-10-${day}T07:00:00`), goal, dur: goal + 20, reached: true, bonus: 20 });
const miss = (day, goal) => ({ t: Date.parse(`2026-10-${day}T07:00:00`), goal, dur: goal - 20, reached: false, bonus: 0 });

// Move the clock forward by exactly `ms`, letting the last 200 ms draw.
async function jump(page, ms) {
  await page.clock.fastForward(ms - 200);
  await page.clock.runFor(200);
}

test('five goals in a row offers one more minute, and steps aside if you stay', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T07:00:00') });
  await page.clock.pauseAt(new Date('2026-10-14T07:00:01'));
  await page.addInitScript((sessions) => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.leadIn', '0');
    localStorage.setItem('cst.holdStop', '0');
    localStorage.setItem('cst.lastBackup', String(Date.now()));
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }]));
    localStorage.setItem('cst.active', 'u1');
    localStorage.setItem('cst.goal.u1', '180');
    localStorage.setItem('cst.sessions.u1', JSON.stringify(sessions));
  }, [miss('08', 180), hit('09', 180), hit('10', 180), hit('11', 180), hit('12', 180), hit('13', 180)]);
  await openApp(page);
  const row = page.getByTestId('goal-row');
  const ladder = page.getByTestId('goal-ladder');

  // Five made in a row since the miss: the offer is there.
  await expect(row).toHaveAttribute('data-streak', '5');
  await expect(ladder).toBeVisible();

  // Taking it raises the goal one minute; the offer goes (no run at 4:00 yet).
  await ladder.click();
  await expect(page.getByTestId('goal-value')).toHaveText('4:00');
  await expect(ladder).toBeHidden();

  // Back to 3:00 — the run is still five, so the offer is back.
  await page.getByTestId('goal-minus').click();
  await expect(ladder).toBeVisible();

  // Stay put: a sixth real shower at 3:00, made. The offer steps aside.
  await page.getByTestId('start-btn').click();
  await jump(page, 190_000);
  await page.getByTestId('start-btn').click();      // stop
  await page.getByTestId('finish-done').click();
  await expect(row).toHaveAttribute('data-streak', '6');
  await expect(row).toHaveAttribute('data-offer', '0');
  await expect(ladder).toBeHidden();
});
