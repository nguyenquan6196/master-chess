import { expect, test, type Page } from '@playwright/test';
import { createPlayer, move } from './helpers';

/** Back-rank mate in 1 for white after black's setup move a7a6 (answer: d1d8). */
const fixture = (n: number) =>
  Array.from({ length: n }, (_, i) => [
    `e2e${i}`,
    '6k1/p4ppp/8/8/8/8/5PPP/3R2K1 b - - 0 1',
    'a7a6 d1d8',
    800 + i,
    80,
    'mateIn1 backRankMate',
  ]);

/** Waits until the opponent's setup move is done and the player may move. */
const yourTurn = (page: Page) =>
  expect(page.getByText('Lượt bạn: tìm nước đi tốt nhất cho Trắng')).toBeVisible();

/** Serve a known puzzle set so tests can solve puzzles deterministically. */
async function usePuzzleFixture(page: Page) {
  await page.route('**/puzzles/**/*.json', (route) => route.fulfill({ json: fixture(20) }));
  await page.route('**/puzzles/daily.json', (route) => route.fulfill({ json: fixture(1) }));
}

test.beforeEach(async ({ page }) => {
  await usePuzzleFixture(page);
  await createPlayer(page);
});

test('rated puzzle: solving raises the rating', async ({ page }) => {
  await page.goto('/practice/rated');
  await yourTurn(page);
  await move(page, 'd1d8');
  await expect(page.getByText('Giải xong! 🎉')).toBeVisible();
  await expect(page.getByText(/^\+\d+$/)).toBeVisible();
  await page.getByRole('button', { name: /Câu tiếp theo/ }).click();
  await yourTurn(page);
});

test('rated puzzle: a wrong move is rejected and lowers the rating', async ({ page }) => {
  await page.goto('/practice/rated');
  await yourTurn(page);
  await move(page, 'g1f1');
  await expect(page.getByText('Chưa đúng, thử lại nhé!')).toBeVisible();
  await expect(page.getByText(/^-\d+$/)).toBeVisible();
});

test('theme training and daily puzzle', async ({ page }) => {
  await page.goto('/practice/themes');
  await page.getByRole('button', { name: 'Đòn ghim' }).click();
  await yourTurn(page);
  await move(page, 'd1d8');
  await expect(page.getByText('Giải xong! 🎉')).toBeVisible();

  await page.goto('/practice/daily');
  await yourTurn(page);
  await move(page, 'd1d8');
  await expect(page.getByText('Giải xong! 🎉')).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Bạn đã giải câu đố hôm nay/)).toBeVisible();
});

test('puzzle rush: score goes up on a solve', async ({ page }) => {
  await page.goto('/practice/rush');
  await page.getByRole('button', { name: 'Bắt đầu 3 phút' }).click();
  await expect(page.getByText('Điểm: 0')).toBeVisible();
  await yourTurn(page);
  await move(page, 'd1d8');
  await expect(page.getByText('Điểm: 1')).toBeVisible();
});

/** Answers a round of choice / select-squares questions (the "pieces" topic has no make-move). */
async function answerRound(page: Page) {
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(`Câu ${i + 1}/10`)).toBeVisible();
    const check = page.getByRole('button', { name: 'Kiểm tra' });
    if (await check.isVisible()) await check.click();
    else await page.locator('main ul li button').first().click();
    await expect(page.getByText(/Đúng rồi|Chưa đúng/)).toBeVisible();
    await page.getByRole('button', { name: /Câu tiếp|Xem kết quả/ }).click();
  }
  await expect(page.getByText(/Bạn trả lời đúng \d+\/10 câu/)).toBeVisible();
}

test('quiz: answer a full round of written questions', async ({ page }) => {
  await page.goto('/practice/quiz');
  await page
    .getByRole('button', { name: /Quân cờ/ })
    .first()
    .click();
  await answerRound(page);
});

test('quiz: answer a full generated round', async ({ page }) => {
  await page.goto('/practice/quiz');
  await expect(page.getByText('Luyện tập thêm')).toBeVisible();
  await page
    .getByRole('button', { name: /Quân cờ/ })
    .nth(1)
    .click();
  await expect(page.getByText('🤖 Máy tạo')).toBeVisible();
  await answerRound(page);
});

test('browser back leaves a sub-screen one step at a time', async ({ page }) => {
  await page.goto('/practice');
  await page.goto('/practice/quiz');
  await page
    .getByRole('button', { name: /Quân cờ/ })
    .first()
    .click();
  await expect(page.getByText('Câu 1/10')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/practice\/quiz$/);
  await expect(page.getByText('Luyện tập thêm')).toBeVisible();
  // The in-page back button goes up one level too.
  await page
    .getByRole('button', { name: /Quân cờ/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Chủ đề', exact: true }).click();
  await expect(page.getByText('Luyện tập thêm')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/practice$/);
});
