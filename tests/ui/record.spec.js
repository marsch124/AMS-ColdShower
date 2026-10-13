// Test 4: the gold mark shows where your longest-ever shower falls — at the top
// for a record lap past the goal, part-way round when the record is shorter
// than the goal — and disappears the moment you pass it.
import { test, expect } from '@playwright/test';
import { openApp } from './_app.js';

// Move the clock forward by exactly `ms`: jump most of the way, then let the
// last 200 ms run frame by frame so the screen draws what that time looks like.
async function jump(page, ms) {
  await page.clock.fastForward(ms - 200);
  await page.clock.runFor(200);
}

test('the gold mark shows where your record falls, and goes when you pass it', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-14T07:00:00') });
  // Frozen: time moves ONLY when the test moves it, so a reading can't drift
  // while an assertion is retrying.
  await page.clock.pauseAt(new Date('2026-10-14T07:00:01'));
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;      // only on the first load
    localStorage.setItem('seeded', '1');
    localStorage.setItem('cst.leadIn', '0');
    localStorage.setItem('cst.holdStop', '0');
    localStorage.setItem('cst.users', JSON.stringify([{ id: 'u1', name: 'Me' }]));
    localStorage.setItem('cst.active', 'u1');
    localStorage.setItem('cst.goal.u1', '60');        // goal 1:00
    localStorage.setItem('cst.sessions.u1', JSON.stringify([   // record 1:30
      { t: Date.parse('2026-10-13T07:00:00'), goal: 60, dur: 90, reached: true, bonus: 30 }]));
  });
  await openApp(page);
  const mark = page.getByTestId('pb-mark');
  // (Shown/hidden is read from the app's own class, not toBeVisible(): the mark
  // is a pair of straight lines, and at 12 o'clock their box is zero wide.)
  const shown = () => expect(mark).not.toHaveClass(/\bhide\b/);
  const hidden = () => expect(mark).toHaveClass(/\bhide\b/);

  // Session 1 — record (1:30) beyond the goal (1:00): nothing during the countdown...
  await page.getByTestId('start-btn').click();
  await jump(page, 30_000);
  await hidden();
  // ...then, past the goal, the mark waits at the top of the ring.
  await jump(page, 40_000);                   // 1:10
  await expect(page.locator('body.done')).toBeAttached();
  await shown();
  await expect(mark).toHaveAttribute('data-at', '0');
  // Pass the record: the mark goes, the screen goes gold.
  await jump(page, 22_000);                   // 1:32
  await expect(page.locator('body.gold')).toBeAttached();
  await hidden();
  await page.getByTestId('start-btn').click();       // stop — the new record is 1:32
  await page.getByTestId('finish-done').click();

  // Session 2 — goal 3:00, record 1:32 is SHORTER: the mark sits part-way round,
  // where the shrinking ring will be at 1:32 → (1 − 92/180) × 360° ≈ 176°.
  await page.getByTestId('preset-180').click();
  await page.getByTestId('start-btn').click();
  await jump(page, 2_000);
  await shown();
  await expect(mark).toHaveAttribute('data-at', '176');
});
