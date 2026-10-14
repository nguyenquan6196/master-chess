import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

test('export the save file, delete the player and import it back', async ({ page }) => {
  await createPlayer(page, 'Người lưu');

  // Some data to carry over: one finished game.
  await page.goto('/play/bot');
  await page.getByRole('button', { name: /Bắt đầu$/ }).click();
  await move(page, 'e2e4');
  await page.getByRole('button', { name: /Xin thua/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xin thua' }).click();

  await page.goto('/profile');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Xuất dữ liệu/ }).click(),
  ]);
  const path = await download.path();
  const save = JSON.parse(readFileSync(path, 'utf8'));
  expect(save).toMatchObject({ app: 'master-chess', schemaVersion: 2 });
  expect(save.profile.name).toBe('Người lưu');
  expect(save.games).toHaveLength(1);
  expect(Array.isArray(save.puzzleAttempts)).toBe(true);

  // Delete, then restore from the file on the "who's playing?" screen.
  await page.getByRole('button', { name: /Xoá người chơi/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xoá người chơi' }).click();
  await expect(page.getByRole('heading', { name: 'Ai đang chơi?' })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(path);
  await page.getByRole('dialog').getByRole('button', { name: 'Nhập dữ liệu' }).click();
  // The restored player is selected and we land back on their profile page.
  await expect(page.getByText('Người lưu').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hồ sơ' })).toBeVisible();
  await page.goto('/history');
  await expect(page.getByText('vs Gà con')).toBeVisible();
});
