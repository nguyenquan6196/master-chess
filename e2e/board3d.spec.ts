import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

test('3D board: toggles on, remembers the choice, and back to 2D', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/play/local');
  await move(page, 'e2e4');

  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-square="e4"]')).toHaveCount(0);

  // The choice is a setting: it survives a reload.
  await page.reload();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

  // Lessons stay 2D even with 3D on.
  await page.goto('/learn');
  await expect(page.locator('canvas')).toHaveCount(0);

  await page.goto('/play/local');
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('[data-square="e4"]')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});
