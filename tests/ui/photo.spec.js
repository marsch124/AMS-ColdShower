// Test 2: a profile can be given a photo — chosen from the list, shown in the
// name chip, still there after a restart, and removable again.
import { test, expect } from '@playwright/test';
import { openApp, restartApp } from './_app.js';

// A real, upright (portrait) picture, drawn by the browser itself, so the
// app's crop-to-a-square has something to cut.
async function portraitPng(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 60; c.height = 90;
    const g = c.getContext('2d');
    g.fillStyle = '#d33'; g.fillRect(0, 0, 60, 45);
    g.fillStyle = '#33d'; g.fillRect(0, 45, 60, 45);
    return c.toDataURL('image/png').split(',')[1];
  });
  return { name: 'me.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

// What storage holds for this profile's photo, decoded: null, or its size.
async function storedPhoto(page, id) {
  return page.evaluate(async (id) => {
    const v = localStorage.getItem('cst.photo.' + id);
    if (!v) return null;
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = v; });
    return { type: v.slice(5, v.indexOf(';')), w: img.naturalWidth, h: img.naturalHeight };
  }, id);
}

test('a profile can be given a photo, keep it, and lose it again', async ({ page }) => {
  page.on('dialog', (d) => d.accept());              // "Remove … photo?" → yes
  await openApp(page);

  // Starts with the initial, no photo.
  await expect(page.getByTestId('user-chip-av')).toHaveAttribute('data-photo', '0');

  await page.getByTestId('user-chip').click();
  await expect(page.getByTestId('user-sheet')).toBeVisible();
  const row = page.getByTestId('user-row').first();
  const id = await row.getAttribute('data-user');
  await row.getByTestId('user-row-photo').click();
  await expect(page.getByTestId('photo-sheet')).toBeVisible();
  await expect(page.getByTestId('photo-remove')).toBeHidden();   // nothing to remove yet

  await page.getByTestId('photo-input').setInputFiles(await portraitPng(page));

  // Stored as a small square JPEG, and painted from what was stored.
  await expect(page.getByTestId('photo-preview')).toHaveAttribute('data-photo', '1');
  expect(await storedPhoto(page, id)).toEqual({ type: 'image/jpeg', w: 320, h: 320 });
  await expect(page.getByTestId('user-chip-av')).toHaveAttribute('data-photo', '1');
  await expect(row.getByTestId('user-row-photo').locator('.av')).toHaveAttribute('data-photo', '1');
  await expect(page.getByTestId('photo-remove')).toBeVisible();

  // Saved, not merely shown: still there after a restart, on the stats screen too.
  await restartApp(page);
  await expect(page.getByTestId('user-chip-av')).toHaveAttribute('data-photo', '1');
  await expect(page.getByTestId('stats-av')).toHaveAttribute('data-photo', '1');

  // And it can be taken away again.
  await page.getByTestId('user-chip').click();
  await page.getByTestId('user-row').first().getByTestId('user-row-photo').click();
  await page.getByTestId('photo-remove').click();
  await expect(page.getByTestId('photo-preview')).toHaveAttribute('data-photo', '0');
  expect(await storedPhoto(page, id)).toBeNull();
  await page.getByTestId('photo-done').click();
  await expect(page.getByTestId('photo-sheet')).toBeHidden();
  await expect(page.getByTestId('user-chip-av')).toHaveAttribute('data-photo', '0');
});
