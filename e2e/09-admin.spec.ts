import { test, expect } from '@playwright/test';

import { blockSupabase } from './helpers';

/**
 * Test 9 — Back-office admin (SPA statique servie sous /admin/).
 */

test.describe('Back-office admin', () => {
  test("l'écran de connexion admin s'affiche", async ({ page }) => {
    await page.goto('./admin/index.html');
    await expect(page.getByText('OpsPilot Admin').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('admin-login-email')).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });

  test('identifiants invalides ou réseau coupé → erreur affichée', async ({
    page,
  }) => {
    await blockSupabase(page);
    await page.goto('./admin/index.html');
    await page.getByTestId('admin-login-email').fill('inconnu@exemple.com');
    await page.getByTestId('admin-login-password').fill('mauvais-mdp');
    await page.getByTestId('admin-login-submit').click();
    await expect(page.getByTestId('admin-login-error')).toBeVisible({
      timeout: 15_000,
    });
  });
});
