import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

/** Stores a finished Fool's Mate (the player is White and gets mated) for the active player. */
async function seedFoolsMate(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(async () => {
    const open = indexedDB.open('master-chess');
    await new Promise((r) => (open.onsuccess = r));
    const db = open.result;
    const tx = db.transaction(['profiles', 'games'], 'readwrite');
    const profiles = await new Promise<{ id: string }[]>((r) => {
      const q = tx.objectStore('profiles').getAll();
      q.onsuccess = () => r(q.result);
    });
    const now = Date.now();
    const id = 'review-e2e';
    tx.objectStore('games').put({
      id,
      profileId: profiles[0].id,
      mode: 'bot',
      botId: 'fox',
      style: 'balanced',
      playerColor: 'w',
      startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'],
      clock: {
        timeControl: 'none',
        remainingMs: { w: 0, b: 0 },
        running: null,
        runningSince: null,
      },
      status: 'finished',
      result: 'loss',
      endReason: 'checkmate',
      hintsUsed: 0,
      undosUsed: 0,
      rated: false,
      createdAt: now,
      updatedAt: now,
    });
    await new Promise((r) => (tx.oncomplete = r));
    return id;
  });
}

test('review: analyzes a game, classifies moves and lets the player retry a blunder', async ({
  page,
}) => {
  await createPlayer(page);
  await seedFoolsMate(page);
  await page.goto('/history');
  await page.getByRole('link', { name: /Xem lại/ }).click();
  await expect(page.getByRole('heading', { name: /Xem lại ván/ })).toBeVisible();

  // Analysis finishes: accuracy is shown and g4 is a blunder to retry.
  await expect(page.getByText(/^\d+(\.\d)?%$/).first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: /2\. g4/ }).click();
  await expect(page.getByText('Bạn đã đi g4. Hãy tìm nước tốt hơn!')).toBeVisible();
  await move(page, 'e2e4');
  await expect(page.getByText(/Chính xác!|vẫn chưa tốt/)).toBeVisible({ timeout: 30_000 });
});
