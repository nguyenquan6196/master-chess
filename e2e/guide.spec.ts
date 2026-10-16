import { expect, test } from '@playwright/test';
import { createPlayer } from './helpers';

test('guide: explains the site and shows every rank with its boss', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/guide');
  await expect(
    page.getByRole('heading', { name: 'Chào mừng đến Master Chess', level: 2 }),
  ).toBeVisible();
  const ranks = page.locator('#ranks tbody tr');
  await expect(ranks).toHaveCount(8);
  await expect(page.locator('#ranks')).toContainText('dưới 600');
  await expect(page.locator('#ranks')).toContainText('Kiện tướng');
});
