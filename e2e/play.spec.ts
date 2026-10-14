import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

test('local game: moves, checkmate and undo', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/play/local');
  for (const m of ['f2f3', 'e7e5', 'g2g4', 'd8h4']) await move(page, m);
  await expect(page.getByText('Chiếu hết! Đen thắng')).toBeVisible();
  await page.getByRole('button', { name: 'Đi lại' }).click();
  await expect(page.getByText('Lượt Đen đi')).toBeVisible();
});

test('bot game: bot replies, game is autosaved and can be resumed', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/play/bot');
  await page.getByRole('button', { name: /Bắt đầu$/ }).click();

  await move(page, 'e2e4');
  // The bot (engine in a Web Worker) answers: the move list gets a second move.
  const moves = page.locator('ol li').first().locator('span');
  await expect(moves.nth(2)).not.toHaveText('', { timeout: 30_000 });

  await page.reload();
  await expect(page.getByText('Ván đang dở')).toBeVisible();
  await page.getByRole('button', { name: /Chơi tiếp/ }).click();
  await expect(page.locator('ol li').first()).toContainText('e4');

  await page.getByRole('button', { name: /Xin thua/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xin thua' }).click();
  await expect(page.getByRole('heading', { name: 'Bạn thua' })).toBeVisible();

  await page.goto('/history');
  await expect(page.getByText('vs Gà con')).toBeVisible();
});

test('profile: the player is remembered across reloads and can switch', async ({ page }) => {
  await createPlayer(page, 'Người chơi A');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Chào mừng đến Master Chess' })).toBeVisible();
  await page.goto('/profile');
  await page.getByRole('button', { name: /Đổi người chơi/ }).click();
  await expect(page.getByRole('button', { name: /Người chơi A/ })).toBeVisible();
});
