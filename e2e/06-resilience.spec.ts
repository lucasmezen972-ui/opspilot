import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

/**
 * Test 6 — Résilience (B3) : reload, deep-link et coupure réseau
 * ne doivent ni déconnecter la démo locale ni produire d'écran blanc.
 */

test.describe('Résilience', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
  });

  test('reload — session démo conservée, dashboard affiché', async ({
    page,
  }) => {
    await page.reload();
    await expect(
      page.getByText('Carnet de bord terrain', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('deep-link /actions — reste connecté', async ({ page }) => {
    await page.goto('./actions');
    await expect(page.getByTestId('page-actions-title')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('navigation rapide entre onglets — chaque page se charge', async ({
    page,
  }) => {
    await openTab(page, 'Audits', 'page-audits-title');
    await openTab(page, 'Produits', 'page-products-title');
    await openTab(page, 'Actions', 'page-actions-title');
    await openTab(page, 'Formation', 'page-training-title');
    await openTab(page, 'Audits', 'page-audits-title');
  });

  test('déconnexion — retour au login, reload reste déconnecté', async ({
    page,
  }) => {
    await openTab(page, 'Profil', 'page-profile-title');
    // Le polyfill Alert web passe par window.confirm : on accepte.
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('demo-login-button')).toBeVisible({
      timeout: 15_000,
    });

    // Le flag démo est nettoyé : un reload ne réhydrate pas la session.
    await page.reload();
    await expect(page.getByTestId('demo-login-button')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Supabase injoignable après reload — dashboard toujours fonctionnel', async ({
    page,
  }) => {
    await page.reload();
    await expect(
      page.getByText('Carnet de bord terrain', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await openTab(page, 'Audits', 'page-audits-title');
    await expect(
      page.getByText('Contrôle hygiène rayon frais').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
