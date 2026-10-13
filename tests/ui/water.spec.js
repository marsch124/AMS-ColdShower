// Test 5: the water rises with the countdown — a quarter of the way up at a
// quarter of the goal (not half: half is the same from either end), full at the
// goal — and the Settings switch keeps it off.
import { test, expect } from '@playwright/test';
import { openApp, seenOpacity } from './_app.js';

// Move the clock forward by exactly `ms`, letting the last 200 ms draw.
async function jump(page, ms) {
  await page.clock.fastForward(ms - 200);
  await page.clock.runFor(200);
}

test('the water rises with the countdown, and the switch keeps it off', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T07:00:00') });
  // Frozen: time moves ONLY when the test moves it, so a reading can't drift
  // while an assertion is retrying.
  await page.clock.pauseAt(new Date('2026-10-14T07:00:01'));
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.leadIn', '0');
    localStorage.setItem('cst.holdStop', '0');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }]));
    localStorage.setItem('cst.active', 'u1');
    localStorage.setItem('cst.goal.u1', '120');       // goal 2:00
  });
  await openApp(page);
  const water = page.getByTestId('water');

  await page.getByTestId('start-btn').click();
  await jump(page, 30_000);                          // a quarter of the goal
  await expect(page.locator('body.water-on')).toBeAttached();
  await expect(water).toHaveAttribute('data-level', '250');
  // drawn at that height: its top edge three quarters of the way down
  const box = await water.boundingBox();
  const vh = page.viewportSize().height;
  expect(Math.abs(box.y - vh * 0.75)).toBeLessThan(3);
  await expect.poll(() => seenOpacity(page, 'water')).toBe(1);

  await jump(page, 91_000);                          // past the goal
  await expect(page.locator('body.done')).toBeAttached();
  await expect(water).toHaveAttribute('data-level', '1000');

  await page.getByTestId('start-btn').click();       // stop
  await page.getByTestId('finish-done').click();
  await expect(water).toHaveAttribute('data-level', '');

  // Switched off: the next shower runs dry.
  await page.getByTestId('settings-btn').click();
  await page.getByTestId('water-toggle').click();
  await expect(page.getByTestId('water-toggle')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('settings-back').click();
  await page.getByTestId('start-btn').click();
  await jump(page, 30_000);
  await expect(page.locator('body.water-on')).not.toBeAttached();
  await expect(water).toHaveAttribute('data-level', '');
});
