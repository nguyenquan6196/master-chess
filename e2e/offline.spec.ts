import { expect, test } from '@playwright/test';
import { createPlayer, move } from './helpers';

// The service worker is only registered in production builds (E2E_BASE_URL server).
test.skip(!process.env.E2E_BASE_URL, 'needs a production server');
test.use({ serviceWorkers: 'allow' });

test('offline: after a first visit the app reloads and plays without network', async ({
  page,
  context,
}) => {
  await createPlayer(page);
  await page.goto('/play/local');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state;
  });
  // Let the install precache finish, then load the pages once so the SW has them.
  await page.waitForTimeout(1500);
  await page.reload();
  await page.goto('/play/bot');
  await page.goto('/play/local');

  await context.setOffline(true);
  await page.reload();
  await move(page, 'e2e4');
  await expect(page.locator('ol li').first()).toContainText('e4');

  await page.goto('/play/bot');
  await page.getByRole('button', { name: /Bắt đầu$/ }).click();
  await move(page, 'e2e4');
  const moves = page.locator('ol li').first().locator('span');
  await expect(moves.nth(2)).not.toHaveText('', { timeout: 30_000 });
  await context.setOffline(false);
});
