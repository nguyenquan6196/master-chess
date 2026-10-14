import { expect, type Page } from '@playwright/test';

/** Clicks the origin then the destination square (click-to-move). */
export async function move(page: Page, uci: string) {
  await page.locator(`[data-square="${uci.slice(0, 2)}"]`).click();
  await page.locator(`[data-square="${uci.slice(2, 4)}"]`).click();
}

/** Creates a fresh player on the "who's playing?" screen. */
export async function createPlayer(page: Page, name = 'E2E') {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ai đang chơi?' })).toBeVisible();
  await page.getByPlaceholder('Ví dụ: Quân').fill(name);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page.getByRole('heading', { name: 'Chào mừng đến Master Chess' })).toBeVisible();
}
