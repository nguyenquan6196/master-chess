import { expect, test, type Page } from '@playwright/test';
import { createPlayer, move } from './helpers';

/** Puts the active player at `rating` and optionally stores an ongoing game. */
async function seed(page: Page, rating: number, game?: { botId: string; moves: string[] }) {
  await page.evaluate(
    async ({ rating, game }) => {
      const open = indexedDB.open('master-chess');
      await new Promise((r) => (open.onsuccess = r));
      const db = open.result;
      const tx = db.transaction(['profiles', 'games'], 'readwrite');
      const store = tx.objectStore('profiles');
      const all = await new Promise<{ id: string; gameRating: unknown }[]>((r) => {
        const q = store.getAll();
        q.onsuccess = () => r(q.result);
      });
      const profile = all[0];
      profile.gameRating = { rating, rd: 90, vol: 0.06 };
      store.put(profile);
      if (game) {
        const now = Date.now();
        tx.objectStore('games').put({
          id: 'rank-e2e',
          profileId: profile.id,
          mode: 'bot',
          botId: game.botId,
          style: 'balanced',
          playerColor: 'w',
          startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moves: game.moves,
          clock: {
            timeControl: 'none',
            remainingMs: { w: 0, b: 0 },
            running: null,
            runningSince: null,
          },
          status: 'ongoing',
          hintsUsed: 0,
          undosUsed: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
      await new Promise((r) => (tx.oncomplete = r));
    },
    { rating, game },
  );
  await page.reload();
}

test('promotion match: boss intro, then winning it ranks the player up', async ({ page }) => {
  await createPlayer(page);
  await seed(page, 615);
  await page.goto('/play/bot');
  await page.getByRole('button', { name: 'Vào trận thăng hạng' }).click();
  await expect(page.getByRole('dialog', { name: 'Trận thăng hạng' })).toBeVisible();
  await page.getByRole('button', { name: 'Vào trận!' }).click();
  await page.getByRole('button', { name: /Xin thua/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xin thua' }).click();
  await expect(page.getByText('Chưa qua trận thăng hạng. Thử lại nhé!')).toBeVisible();

  // An ongoing promotion match one move from Scholar's mate.
  await seed(page, 615, {
    botId: 'turtle',
    moves: ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6'],
  });
  await page.goto('/play/bot');
  await page.getByRole('button', { name: /Chơi tiếp/ }).click();
  await move(page, 'h5f7');
  await expect(page.getByRole('dialog', { name: '🎉 Lên hạng Bạc!' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Tuyệt vời!' }).click();
  await page.goto('/profile');
  await expect(page.getByText(/^Bạc (III|II|I)$/)).toBeVisible();
});
