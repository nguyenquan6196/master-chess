import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

test('learn: lessons unlock in order and can be completed', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: '📖 Học cờ vua' })).toBeVisible();
  await expect(page.getByText('0/18 bài')).toBeVisible();
  // Only the first lesson is open.
  await expect(page.getByRole('link', { name: /Bàn cờ/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Tên ô và ký hiệu/ })).toHaveCount(0);

  await page.goto('/learn/board');
  await expect(page.getByRole('heading', { name: 'Hàng ngang và cột dọc' })).toBeVisible();
  // Answer the 3 quiz questions (any answer), then finish.
  for (let i = 0; i < 3; i++) {
    await page.locator('section ul li button:not([disabled])').first().click();
  }
  await page.getByRole('button', { name: /Hoàn thành bài học/ }).click();
  await expect(page.getByText('Hoàn thành! 🎉')).toBeVisible();
  await page.getByRole('link', { name: /Bài tiếp theo/ }).click();

  // Lesson 2 is now unlocked; its "try it" exercise accepts the right move.
  await expect(page.getByRole('heading', { name: /Tên ô và ký hiệu/ })).toBeVisible();
  const exercise = page.locator('section', { hasText: '🎯 Thử ngay' }).first();
  await move(page, 'e2e4', exercise);
  await expect(exercise.getByText('Đúng rồi! ✅')).toBeVisible();

  await page.goto('/learn');
  await expect(page.getByText('1/18 bài').first()).toBeVisible();
});

test('learn: a locked lesson shows what to finish first', async ({ page }) => {
  await createPlayer(page);
  await page.goto('/learn/castling');
  await expect(
    page.getByText(/Hoàn thành bài “Chiếu, chiếu hết, hòa pat” để mở khoá/),
  ).toBeVisible();
});

test('learn: lesson content follows the language setting', async ({ page }) => {
  await createPlayer(page);
  await page.getByRole('combobox', { name: 'Ngôn ngữ' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await page.goto('/learn/board');
  await expect(page.getByRole('heading', { name: 'Ranks and files' })).toBeVisible();
});
